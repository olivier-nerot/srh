/**
 * Script to find all members with duplicate subscriptions
 * Run with: node scripts/find-duplicate-subscriptions.js
 */

import Stripe from "stripe";
import * as fs from "fs";
import * as dotenv from "dotenv";

dotenv.config();

const isTestMode = process.env.VITE_STRIPE_TESTMODE === "true";
const stripeSecretKey = isTestMode
  ? process.env.VITE_STRIPE_TEST_SECRET_API_KEY ||
    process.env.STRIPE_TEST_SECRET_API_KEY
  : process.env.VITE_STRIPE_SECRET_API_KEY || process.env.STRIPE_SECRET_API_KEY;

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-11-20.acacia",
});

const requestOptions = {
  stripeAccount: process.env.VITE_STRIPE_COMPANY_ID,
};

async function findDuplicateSubscriptions() {
  console.log("Fetching all subscriptions from Stripe...");
  console.log("Test mode:", isTestMode);

  // Fetch all subscriptions (active and trialing)
  const allSubscriptions = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = {
      limit: 100,
      status: "all",
      expand: ["data.customer"],
    };
    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const subscriptions = await stripe.subscriptions.list(
      params,
      requestOptions
    );
    allSubscriptions.push(...subscriptions.data);
    hasMore = subscriptions.has_more;
    if (subscriptions.data.length > 0) {
      startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
    }
  }

  console.log(`Found ${allSubscriptions.length} total subscriptions`);

  // Group by customer email
  const subscriptionsByEmail = {};

  for (const sub of allSubscriptions) {
    // Only consider active or trialing subscriptions
    if (sub.status !== "active" && sub.status !== "trialing") {
      continue;
    }

    const customer = sub.customer;
    const email = typeof customer === "object" ? customer.email : null;

    if (!email) continue;

    if (!subscriptionsByEmail[email]) {
      subscriptionsByEmail[email] = [];
    }

    subscriptionsByEmail[email].push({
      id: sub.id,
      status: sub.status,
      created: new Date(sub.created * 1000).toISOString(),
      current_period_start: new Date(
        sub.current_period_start * 1000
      ).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      default_payment_method: sub.default_payment_method ? "Yes" : "No",
      amount:
        sub.items.data[0]?.price?.unit_amount / 100 ||
        sub.items.data[0]?.plan?.amount / 100 ||
        "N/A",
    });
  }

  // Find members with duplicates (more than 1 subscription)
  const duplicates = {};
  for (const [email, subs] of Object.entries(subscriptionsByEmail)) {
    if (subs.length > 1) {
      // Sort by created date (newest first)
      subs.sort((a, b) => new Date(b.created) - new Date(a.created));
      duplicates[email] = subs;
    }
  }

  console.log(
    `Found ${Object.keys(duplicates).length} members with duplicate subscriptions`
  );

  // Generate markdown report
  let markdown = `# Membres avec Abonnements en Double

**Date de génération**: ${new Date().toISOString().split("T")[0]}
**Nombre de membres concernés**: ${Object.keys(duplicates).length}

---

## Résumé

| Email | Nombre d'abonnements | Action recommandée |
|-------|---------------------|-------------------|
`;

  for (const [email, subs] of Object.entries(duplicates)) {
    markdown += `| ${email} | ${subs.length} | Garder le plus récent, annuler les autres |\n`;
  }

  markdown += `\n---\n\n## Détails par Membre\n\n`;

  for (const [email, subs] of Object.entries(duplicates)) {
    markdown += `### ${email}\n\n`;
    markdown += `**Nombre d'abonnements**: ${subs.length}\n\n`;
    markdown += `| ID | Statut | Créé le | Fin période | Moyen de paiement | Montant | À conserver |\n`;
    markdown += `|----|--------|---------|-------------|-------------------|---------|-------------|\n`;

    subs.forEach((sub, index) => {
      const keep = index === 0 ? "✅ OUI" : "❌ À annuler";
      const createdDate = sub.created.split("T")[0];
      const endDate = sub.current_period_end.split("T")[0];
      markdown += `| \`${sub.id}\` | ${sub.status} | ${createdDate} | ${endDate} | ${sub.default_payment_method} | ${sub.amount}€ | ${keep} |\n`;
    });

    markdown += `\n`;
  }

  markdown += `---\n\n## Commande de nettoyage\n\n`;
  markdown += `Pour nettoyer les abonnements en double, utilisez l'action admin "cleanup-duplicate-subscriptions" dans l'interface d'administration ou via l'API:\n\n`;
  markdown += `\`\`\`bash\n`;
  markdown += `curl -X POST "http://localhost:3002/api/stripe?action=cleanup-duplicate-subscriptions"\n`;
  markdown += `\`\`\`\n\n`;

  markdown += `## Abonnements à annuler (détail)\n\n`;
  markdown += `\`\`\`json\n`;

  const toCancel = [];
  for (const [email, subs] of Object.entries(duplicates)) {
    // Keep the first (newest), cancel the rest
    for (let i = 1; i < subs.length; i++) {
      toCancel.push({
        email,
        subscriptionId: subs[i].id,
        created: subs[i].created,
        status: subs[i].status,
      });
    }
  }

  markdown += JSON.stringify(toCancel, null, 2);
  markdown += `\n\`\`\`\n`;

  // Write to file
  const outputPath = "./docs/duplicates.md";
  fs.writeFileSync(outputPath, markdown);
  console.log(`Report written to ${outputPath}`);

  return { duplicates, toCancel };
}

findDuplicateSubscriptions()
  .then(({ duplicates, toCancel }) => {
    console.log("\n=== SUMMARY ===");
    console.log(`Members with duplicates: ${Object.keys(duplicates).length}`);
    console.log(`Subscriptions to cancel: ${toCancel.length}`);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });
