import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { UserProvider } from './components/UserContext'; // Make sure the path is correct

import Header from "./components/Header";
import Home from "./Home";
import Footer from "./components/Footer";
import Jobs from "./Jobs";
import Freelancers from "./Freelancers";
import ProjectDetailPage from "./ProjectDetailPage";
import PostProject from "./PostProject";
import ViewProfile from "./ViewProfile";
import Profile from "./Profile";
import ToastContainer from "./components/ToastContainer";
import Login from "./Login";
import ClientDashboard from "./ClientDashboard";

const App = () => (
  <UserProvider>
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/freelancers" element={<Freelancers />} />
        <Route path="/details/:id" element={<ProjectDetailPage />} />
        <Route path="/post-project" element={<PostProject />} />
        <Route path="/view-profile/:id" element={<ViewProfile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/client-dashboard" element={<ClientDashboard />} />
      </Routes>
      <Footer />
      <ToastContainer />
    </Router>
  </UserProvider>
);

export default App;
