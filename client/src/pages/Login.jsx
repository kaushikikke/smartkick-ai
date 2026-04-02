import { useState } from "react";
import axios from "axios";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {

    try {

      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password }
      );

      localStorage.setItem("player_id", res.data.player_id);

      window.location = "/dashboard";

    } catch (err) {

      alert("Login failed");

    }

  };

  return (

    <div style={{padding:"40px"}}>

      <h1>Player Login</h1>

      <input
        placeholder="Email"
        onChange={(e)=>setEmail(e.target.value)}
      />

      <br/><br/>

      <input
        type="password"
        placeholder="Password"
        onChange={(e)=>setPassword(e.target.value)}
      />

      <br/><br/>

      <button onClick={handleLogin}>
        Login
      </button>

      <br/><br/>

      <a href="/signup">Create account</a>

    </div>

  );
}

export default Login;