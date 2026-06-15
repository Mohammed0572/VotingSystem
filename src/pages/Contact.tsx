

const Contact = () => {
  return (
    <div className="gov-panel p-6 sm:p-8 max-w-4xl w-full fade-in text-center">
      <div className="mb-6 flex justify-center">
        <div className="w-20 h-20 bg-[#005ea2] rounded-full flex items-center justify-center text-white">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
        </div>
      </div>
      <h1 className="text-3xl font-bold font-heading text-[#112e51] mb-2">Contact Support</h1>
      <p className="text-[#565c65] mb-8">For technical issues, feedback, or general inquiries regarding the pilot voting system, please reach out to our primary point of contact below.</p>
      
      <div className="bg-cream p-6 rounded-md inline-block text-left w-full max-w-md border border-[#dfe1e2]">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-[#565c65] uppercase tracking-wider mb-1">System Administrator</h3>
          <p className="text-xl font-heading text-[#112e51]">Syed Mohammed Naqvi</p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#565c65] uppercase tracking-wider mb-1">Direct Email</h3>
          <a href="mailto:mohammednaqvi725@gmail.com" className="text-[#005ea2] hover:underline font-medium text-lg">mohammednaqvi725@gmail.com</a>
        </div>
      </div>
    </div>
  );
};

export default Contact;
