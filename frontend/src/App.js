import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Home from "./Home";
import Footer from "./components/Footer";
import Jobs from "./Jobs";
import Freelancers from "./Freelancers";

const App = () => (
  <Router>
    <Header />
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/freelancers" element={<Freelancers />} />
    </Routes>
    <Footer />
  </Router>
);

export default App;
