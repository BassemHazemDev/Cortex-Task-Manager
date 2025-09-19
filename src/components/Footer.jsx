

const Footer = () => (
  <footer className="w-full flex justify-center py-8 px-32 mt-12 bg-transparent">
    <div
      className="max-w-7xl w-full mx-auto rounded-2xl shadow-lg border border-border bg-card text-card-foreground dark:bg-[#18181b] dark:text-gray-200 px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4"
      style={{
        background: 'var(--card)',
        color: 'var(--card-foreground)',
        boxShadow: '0 2px 24px 0 rgba(0,0,0,0.08)',
        border: '1px solid var(--border)',
      }}
    >
      <span className="text-sm font-semibold tracking-wide opacity-80 flex items-center gap-2">
        <img src="/cortex1.png" alt="Cortex Logo" className="h-4 block dark:hidden" />
        <img src="/cortex2.png" alt="Cortex Logo Dark" className="h-4 hidden dark:block" />
        {new Date().getFullYear()} Cortex Task Manager
      </span>
      <div className="flex items-center gap-4">
        <a
          href="https://github.com/BassemHazemDev/Cortex-Task-Manager"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold px-3 py-1 rounded hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 transition-colors"
          style={{ color: 'var(--primary)' }}
        >
          GitHub
        </a>
        <span className="w-px h-5 bg-border dark:bg-gray-700 mx-2" style={{ background: 'var(--primary)' }}/>
        <a
          href="mailto:bassemhazemmahmouddev@gmail.com"
          className="text-xs font-semibold px-3 py-1 rounded hover:bg-accent/10 hover:text-accent dark:hover:bg-accent/20 transition-colors"
          style={{ color: 'var(--primary)' }}
        >
          Contact
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
