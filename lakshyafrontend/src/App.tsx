import { Navigate,Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import { useState } from "react";
import RefreshHandler from "./RefreshHandler";
import SignupChoice from "./pages/SignupChoice";
import Landing from "./pages/Landing";


function App() {
  const [isAuthenticated ,setIsAuthenticated] = useState(false);


  const PrivateRoute = ({ element }: { element: React.ReactElement }) => {
  return isAuthenticated ? element : <Navigate to="/login" />;
};


  return (
    <div className ="App">
      <RefreshHandler setIsAuthenticated={setIsAuthenticated} />
      <h1>Lakshya Frontend Running 🚀</h1>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup-choice" element={<SignupChoice />} />
        <Route path="/signup/:role" element={<Signup />} />
        <Route path="/home" element={<PrivateRoute element={<Home />} />} />
      </Routes>
    </div>        
  );
}

export default App;
