import '../styles/topbar.css';
const Topbar = () => {
  return (
    <header className="topbar">
      {/* LEFT SIDE: LOGO + NAME */}
      <div className="topbar-left">
        <div className="logo-circle">
          ✈️
        </div>
        <h2 className="agency-name">KUKAT Travel Agency</h2>
      </div>

      {/* RIGHT SIDE: USER PROFILE */}
      <div className="topbar-right">
        <span className="user-name">Ulrich</span>
        <div className="avatar">
          <img
            src="https://ui-avatars.com/api/?name=U+S&background=4f46e5&color=fff"
            alt="User Avatar"
          />
        </div>
      </div>
    </header>
  );
};

export default Topbar;