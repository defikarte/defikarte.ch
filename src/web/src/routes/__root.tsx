import { Outlet, createRootRoute, useLocation, useMatchRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useMediaQuery } from 'react-responsive';
import { FullScreenContext } from '../context/FullScreenContext';
import { Footer } from '../modules/footer/Footer';
import { EmbedNavbar } from '../modules/nav-bar/embed-nav-bar/EmbedNavBar';
import { Navbar } from '../modules/nav-bar/NavBar';
import { NotFound } from '../modules/not-found/NotFound';

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
};

function RootComponent() {
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const matchRoute = useMatchRoute();
  const isEmbedded = matchRoute({ to: '/map' });
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isMedium = useMediaQuery({ maxWidth: 1024 });
  const position: 'top-right' | 'bottom-center' = isMobile ? 'bottom-center' : 'top-right';

  return (
    <div className="flex flex-col">
      <Toaster
        position={position}
        containerStyle={{
          zIndex: 50,
          top: isMobile ? 'auto' : isMedium ? '4.75rem' : '5.5rem',
          bottom: isMobile ? '4.875rem' : 'auto',
          left: isMobile ? '1rem' : 'auto',
          right: isMobile ? '1rem' : '1.5rem',
          width: isMobile ? 'auto' : '100%',
        }}
        toastOptions={{ duration: 7200 }}
      />
      {isEmbedded ? <EmbedNavbar /> : <Navbar />}
      <ScrollToTop />
      <FullScreenContext value={{ isMapFullscreen, setIsMapFullscreen }}>
        <Outlet />
      </FullScreenContext>
      {!isMapFullscreen && !isEmbedded && <Footer />}
    </div>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
});
