

const Privacy = () => {
  return (
    <div className="gov-panel p-6 sm:p-8 max-w-4xl w-full fade-in">
      <h1 className="text-3xl font-bold font-heading text-[#112e51] mb-6">Privacy Policy</h1>
      <div className="space-y-4 text-[#565c65]">
        <p><strong>1. Data Collection</strong><br/>We collect standard citizen identification details and facial biometric data strictly for the purpose of voter authentication.</p>
        <p><strong>2. Biometric Data Handling</strong><br/>Your facial biometric data is processed dynamically during the login phase to generate a cryptographic hash. The raw image data is never permanently stored on our servers.</p>
        <p><strong>3. Blockchain Anonymity</strong><br/>When a vote is cast, it is recorded on the Ethereum blockchain. The transaction is fully anonymized and decoupled from your personal identity to ensure ballot secrecy.</p>
        <p><strong>4. Information Sharing</strong><br/>We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information. This does not include trusted third parties who assist us in operating our system, so long as those parties agree to keep this information confidential.</p>
      </div>
    </div>
  );
};

export default Privacy;
