import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { UserContext } from "./UserContext"; // Adjust the path if needed
import "./Header.css";

const Header = () => {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const isLoggedIn = !!user;
  const isClient = user?.userType ?? null;

  const handleLogout = () => {
    setUser(null); // This updates the context and triggers re-render
    navigate('/');
  };

  return (
    <nav>
      {/* Logo with Home link */}
      <div className="logo-container">
        <Link to="/">
          <img 
            src="https://i.ibb.co/cSJbN5jL/logo.png" 
            alt="Logo" 
            className="logo"
          />
        </Link>
        <span>SkillNest</span>
      </div>

      {/* Navigation Links */}
      <div className="nav-links">
  <Link to="/">Home</Link>

  {(!isLoggedIn || isClient === "freelancer") && (
    <Link to="/jobs">Find Jobs</Link>
  )}

  {(!isLoggedIn || isClient === "client") && (
    <Link to="/freelancers">Find Freelancers</Link>
  )}

  <Link to="/profile">Profile</Link>
</div>

      {/* Login / Logout Button */}
      {isLoggedIn ? (
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      ) : (
        <button className="logout-btn" onClick={() => navigate('/login')}>Login</button>
      )}
    </nav>
  );
};

export default Header;
