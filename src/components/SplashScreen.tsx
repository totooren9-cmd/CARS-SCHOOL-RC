import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onFinish, 450);
    }, 1600);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      id="splash"
      className={fadeOut ? 'hidden' : ''}
      onClick={() => {
        setFadeOut(true);
        setTimeout(onFinish, 200);
      }}
      title="แตะเพื่อข้าม"
    >
      <div className="splash-bg"></div>
      <div className="splash-content">
        <div className="splash-logo">
          <div className="splash-icon">🚌</div>
          <div className="splash-ring"></div>
          <div className="splash-ring delay"></div>
        </div>
        <h1>QR BUS</h1>
        <p>ระบบเช็คอินนักเรียนขึ้นรถ</p>
        <div className="splash-loader">
          <span></span>
        </div>
      </div>
    </div>
  );
};
