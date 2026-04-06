const Footer = () => {
  return (
    <footer className="py-10 px-10 border-t border-black/5 dark:border-white/5 bg-[#020617]/20 backdrop-blur-md text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <p className="opacity-40">© 2026 Protocol Intelligence. All systems operational.</p>
        <div className="flex gap-8">
          <a href="#" className="hover:text-blue-400 transition-colors">Neural Privacy</a>
          <a href="#" className="hover:text-blue-400 transition-colors">Service Terms</a>
          <a href="#" className="hover:text-blue-400 transition-colors">Support Core</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
