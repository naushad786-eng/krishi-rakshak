import { useState } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard'; // Import our new component!

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // If the user is NOT authenticated, show the Login/Register screen
  if (!isAuthenticated) {
    return <Auth onSuccessfulAuth={() => setIsAuthenticated(true)} />;
  }

  // If they ARE authenticated, show the new Image Upload Dashboard
  return <Dashboard onLogout={() => setIsAuthenticated(false)} />;
}

export default App;