import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const handleJoin = () => {
    navigate("/room/classroom-101"); // Static or dynamic roomId
  };

  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Welcome to the Class</h1>
      <button onClick={handleJoin}>Join Class</button>
    </div>
  );
};

export default Home;
