import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../component/Navbar/Nav';
const AppLayout = ({ children }) => {
  const location = useLocation();

  // Routes that should NOT show Sidebar & Navbar
  const hideLayoutRoutes = ['/tracking/:awb', '/login', '/e-login', '/register', '/ForgotPassword'];
  
  // Use regex to match dynamic routes like `/tracking/123456`
  const hideLayout = /^\/tracking\/[^/]+$/.test(location.pathname);

  return (
    <>
      {!hideLayout && <Sidebar />}
      {!hideLayout && <Navbar />}
      <main className={hideLayout}>
        {children}
      </main>
    </>
  );
};
export default AppLayout
