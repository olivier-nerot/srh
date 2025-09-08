// Test script for Stripe payment API
// Run with: node test-payment.js

const testPayment = async () => {
  const testData = {
    amount: 5000, // 50.00 EUR in cents
    currency: 'eur',
    customer: {
      email: 'test@example.com',
      name: 'Test User',
      hospital: 'Test Hospital'
    },
    recurring: true,
    tierData: {
      id: 'practicing',
      name: 'Adhésion Praticien Hospitalier',
      price: 50,
      description: 'Test membership tier'
    }
  };

  try {
    console.log('🧪 Testing Stripe Payment API...');
    console.log('📝 Test Data:', JSON.stringify(testData, null, 2));

    // Test the consolidated Stripe API
    const response = await fetch('http://localhost:3002/api/stripe?action=create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('\n📊 API Response:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('✅ Payment test successful!');
      console.log('Type:', result.type);
      console.log('Subscription ID:', result.subscriptionId);
      console.log('Client Secret:', result.clientSecret ? 'Present' : 'Not present');
      console.log('Customer ID:', result.customer?.id);
      console.log('Customer Email:', result.customer?.email);
    } else {
      console.log('❌ Payment test failed:');
      console.log('Error:', result.error);
    }

    return result;
  } catch (error) {
    console.error('🚨 Test script error:', error.message);
    return { success: false, error: error.message };
  }
};

// Run the test
testPayment().then((result) => {
  console.log('\n🏁 Test completed');
  process.exit(result.success ? 0 : 1);
});