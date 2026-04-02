import { useState } from "react";
import axios from "axios";

function Signup() {

  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");

  const handleSignup = async () => {

    await axios.post(
      "http://localhost:5000/api/auth/signup",
      { name,email,password }
    );

    alert("Account created");

    window.location = "/";

  };

  return (

    <div style={{padding:"40px"}}>

      <h1>Signup</h1>

      <input
        placeholder="Name"
        onChange={(e)=>setName(e.target.value)}
      />

      <br/><br/>

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

      <button onClick={handleSignup}>
        Signup
      </button>

    </div>

  );
}

export default Signup;