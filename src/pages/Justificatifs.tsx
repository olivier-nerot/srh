import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useMembershipStatus } from "../hooks/useMembershipStatus";
import { getUserLastPayment, type Payment } from "../services/paymentService";
import { FileText, Download, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getYearFromPayment(payment: Payment): number {
  return new Date(payment.created).getFullYear();
}

function formatAmount(amount: number): string {
  return amount.toFixed(2).replace(".", ",");
}

async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = reject;
    img.src = url;
  });
}

async function generateAttestation(
  payment: Payment,
  user: { firstname: string; lastname: string; email: string },
  signatureBase64: string,
  logoBase64: string,
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const year = getYearFromPayment(payment);
  const paymentDate = new Date(payment.created);

  // Logo en haut a gauche
  doc.addImage(logoBase64, "PNG", 15, 10, 25, 25);

  // Texte "Syndicat des Radiologues Hospitaliers" a cote du logo
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(23, 108, 180); // srh-blue
  doc.text("Syndicat des", 42, 18);
  doc.text("Radiologues", 42, 23);
  doc.text("Hospitaliers", 42, 28);

  // "Paris, le" + date en haut a droite
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(`Paris, le ${formatDate(paymentDate)}`, pageWidth - 20, 30, {
    align: "right",
  });

  // Titre principal
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(`ATTESTATION D'ADHESION ${year}`, pageWidth / 2, 70, {
    align: "center",
  });

  // Informations du membre
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  let y = 100;

  doc.text("Nom :", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(user.lastname, 55, y);

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Prenom :", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(user.firstname, 55, y);

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Adresse mail :", 20, y);
  doc.setFont("helvetica", "normal");
  doc.text(user.email, 55, y);

  // Corps du texte
  y += 25;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    `A adhere au syndicat des radiologues Hospitaliers en ${year} pour un montant de : ${formatAmount(payment.amount)} euros`,
    20,
    y,
    { maxWidth: pageWidth - 40 },
  );

  // Signature
  const sigY = 190;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("La tresoriere,", pageWidth - 60, sigY, { align: "center" });
  doc.text("Dr Anne Liesse,", pageWidth - 60, sigY + 8, { align: "center" });

  // Image de la signature
  doc.addImage(signatureBase64, "PNG", pageWidth - 85, sigY + 12, 50, 25);

  doc.save(`attestation_adhesion_srh_${year}.pdf`);
}

const Justificatifs: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { isValidMember, isLoading: membershipLoading } = useMembershipStatus();

  const isAdmin = user?.isadmin === true;
  const hasAdminBypass = isAdmin && !isValidMember;

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [signatureBase64, setSignatureBase64] = useState<string>("");
  const [logoBase64, setLogoBase64] = useState<string>("");

  const loadAssets = useCallback(async () => {
    const [sig, logo] = await Promise.all([
      loadImageAsBase64("/signature-tresoriere.svg"),
      loadImageAsBase64("/icon.png"),
    ]);
    setSignatureBase64(sig);
    setLogoBase64(logo);
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    async function fetchPayments() {
      if (!user?.email) return;
      setPaymentsLoading(true);
      const result = await getUserLastPayment(user.email);
      if (result.success && result.paymentHistory) {
        const successful = result.paymentHistory.filter(
          (p) => p.status === "succeeded",
        );
        setPayments(successful);
      }
      // Admin sans paiement : ajouter un justificatif fictif pour tester
      if (
        isAdmin &&
        (!result.paymentHistory ||
          result.paymentHistory.filter((p) => p.status === "succeeded")
            .length === 0)
      ) {
        setPayments([
          {
            id: "fake-admin-preview",
            amount: 150,
            currency: "eur",
            status: "succeeded",
            created: new Date(),
            description: "Adhesion SRH (apercu admin)",
          },
        ]);
      }
      setPaymentsLoading(false);
    }

    if (isAuthenticated && (isValidMember || isAdmin)) {
      fetchPayments();
    }
  }, [isAuthenticated, isValidMember, isAdmin, user?.email]);

  const handleDownload = async (payment: Payment) => {
    if (!user || !signatureBase64 || !logoBase64) return;
    setGeneratingId(payment.id);
    try {
      await generateAttestation(
        payment,
        {
          firstname: user.firstname,
          lastname: user.lastname,
          email: user.email,
        },
        signatureBase64,
        logoBase64,
      );
    } finally {
      setGeneratingId(null);
    }
  };

  // Non authentifie
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Justificatifs
              </h1>
              <p className="text-xl opacity-90">
                Acces reserve aux membres du SRH
              </p>
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-20 bg-gray-50"
            style={{ clipPath: "ellipse(100% 100% at 50% 100%)" }}
          ></div>
        </section>

        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-srh-blue rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Acces Restreint
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Cette section est exclusivement reservee aux membres du Syndicat
                des Radiologues Hospitaliers.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Vous n'etes pas encore membre ?</strong>
              </p>
              <p className="text-sm text-gray-600">
                Rejoignez le SRH pour acceder a vos justificatifs fiscaux et
                beneficier de notre accompagnement professionnel.
              </p>
            </div>

            <button
              onClick={() => navigate("/jadhere-au-srh")}
              className="bg-srh-blue hover:bg-srh-blue-dark text-white px-8 py-3 rounded-md text-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              Adherer au SRH
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>

            <p className="text-sm text-gray-500 mt-4">
              Deja membre ?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-srh-blue hover:text-srh-blue-dark underline font-medium"
              >
                Connectez-vous ici
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Chargement membership
  if (membershipLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-srh-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Verification de votre adhesion...</p>
        </div>
      </div>
    );
  }

  // Adhesion non valide
  if (!isValidMember && !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Justificatifs
              </h1>
              <p className="text-xl opacity-90">
                Acces reserve aux membres actifs
              </p>
            </div>
          </div>
          <div
            className="absolute bottom-0 left-0 right-0 h-20 bg-gray-50"
            style={{ clipPath: "ellipse(100% 100% at 50% 100%)" }}
          ></div>
        </section>

        <div className="max-w-2xl mx-auto px-4 py-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Adhesion requise
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Votre compte est enregistre mais votre adhesion n'est pas
                active.
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
              <p className="text-gray-700 mb-2">
                <strong>Completez votre adhesion</strong>
              </p>
              <p className="text-sm text-gray-600">
                Pour acceder a vos justificatifs fiscaux, veuillez finaliser
                votre adhesion en procedant au paiement de votre cotisation
                annuelle.
              </p>
            </div>

            <button
              onClick={() => navigate("/jadhere-au-srh")}
              className="bg-srh-blue hover:bg-srh-blue-dark text-white px-8 py-3 rounded-md text-lg font-medium transition-colors inline-flex items-center gap-2"
            >
              Completer mon adhesion
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Contenu principal pour membres valides
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-srh-blue text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Justificatifs
            </h1>
            <p className="text-xl opacity-90">
              Attestations d'adhesion et justificatifs fiscaux
            </p>
          </div>
        </div>
        <div
          className="absolute bottom-0 left-0 right-0 h-20 bg-gray-50"
          style={{ clipPath: "ellipse(100% 100% at 50% 100%)" }}
        ></div>
      </section>

      {/* Admin bypass warning */}
      {hasAdminBypass && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-2 text-amber-800">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-sm font-medium">
                Acces administrateur : vous visualisez cette page sans adhesion
                active.
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-16">
        {paymentsLoading ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-srh-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de vos justificatifs...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Aucun justificatif disponible
            </h2>
            <p className="text-gray-500">
              Aucun paiement n'a ete trouve pour votre compte. Les justificatifs
              seront disponibles apres votre premier paiement d'adhesion.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 mb-6">
              Retrouvez ci-dessous vos attestations d'adhesion au SRH. Cliquez
              sur le bouton de telechargement pour obtenir votre justificatif au
              format PDF.
            </p>

            {payments.map((payment) => {
              const year = getYearFromPayment(payment);
              const date = new Date(payment.created);
              const isGenerating = generatingId === payment.id;

              return (
                <div
                  key={payment.id}
                  className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-between hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-srh-blue/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-srh-blue" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Attestation d'adhesion {year}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Paiement du {formatDate(date)} —{" "}
                        {formatAmount(payment.amount)} EUR
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownload(payment)}
                    disabled={isGenerating || !signatureBase64 || !logoBase64}
                    className="bg-srh-blue hover:bg-srh-blue-dark disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generation...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        Telecharger PDF
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Justificatifs;
