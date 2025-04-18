import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Header.css";
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    // Check if user item exists in localStorage
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
  };

  return (
    <nav>
      {/* Logo with Home link */}
      <div className="logo-container">
        <Link to="/"> {/* Wrap the logo inside Link */}
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
        <Link to="/jobs">Find Jobs</Link>
        <Link to="/freelancers">Find Freelancers</Link>
        <Link to="/profile">Profile</Link>
      </div>

      {/* Login / Logout Button */}
      {isLoggedIn ? (
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      ) : (
        <button className="logout-btn" onClick={()=>navigate('/login')}>Login</button>
      )}
    </nav>
  );
};

export default Header;
