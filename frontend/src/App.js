import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./Home";
import Footer from "./components/Footer";
import Jobs from "./Jobs";
import Freelancers from "./Freelancers";
import ProjectDetailPage from "./ProjectDetailPage";
import PostProject from "./PostProject";
import ViewProfile from "./ViewProfile";
import Profile from "./Profile";


const App = () => (
  <Router>
    <Header />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/freelancers" element={<Freelancers />} />
      <Route path="/details" element={<ProjectDetailPage />} />
      <Route path="/post-project" element={<PostProject />} />
      <Route path="/view-profile" element={<ViewProfile />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
    <Footer />
  </Router>
);

export default App;
