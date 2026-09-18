import React, { useState, useRef, useEffect } from 'react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [digits, setDigits] = useState<string[]>(Array(8).fill(''));
  const [errorMsg, setErrorMsg] = useState<string>('');
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(Array(8).fill(''));
      setErrorMsg('');
      setTimeout(() => {
        inputsRef.current[0]?.focus();
      }, 150);
    }
  }, [isOpen]);

  const handleDigitChange = (index: number, val: string) => {
    setErrorMsg('');
    const char = val.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    if (char && index < 7) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'Enter') {
      submitLogin();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8);
    if (pasted) {
      const newDigits = Array(8).fill('');
      for (let i = 0; i < pasted.length; i++) {
        newDigits[i] = pasted[i];
      }
      setDigits(newDigits);
      const focusIndex = Math.min(pasted.length, 7);
      inputsRef.current[focusIndex]?.focus();
    }
  };

  const submitLogin = () => {
    const entered = digits.join('');
    // Required Admin Password: 43210344
    if (entered === '43210344') {
      setErrorMsg('');
      onSuccess();
    } else {
      setErrorMsg('รหัสผ่านไม่ถูกต้อง (ลอง 43210344)');
      setDigits(Array(8).fill(''));
      inputsRef.current[0]?.focus();
    }
  };

  const autoFillDemo = () => {
    const demo = ['4', '3', '2', '1', '0', '3', '4', '4'];
    setDigits(demo);
    setErrorMsg('');
  };

  return (
    <div
      className={`sheet-overlay ${isOpen ? 'active' : ''}`}
      id="loginSheet"
      onClick={onClose}
    >
      <div
        className="bottom-sheet"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-grabber"></div>
        <div className="sheet-content">
          <div className="login-icon">🔐</div>
          <h2>เข้าสู่ระบบจัดการ</h2>
          <p className="muted">กรุณากรอกรหัสผ่านแอดมิน (43210344)</p>

          <div className="pass-boxes" id="passBoxes" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputsRef.current[idx] = el;
                }}
                type="password"
                maxLength={1}
                inputMode="numeric"
                autoComplete="off"
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
              />
            ))}
          </div>

          <div className="login-err" id="loginErr">
            {errorMsg}
          </div>

          <div className="flex flex-col gap-2 w-full max-w-xs">
            <button
              className="btn-ios-primary w-full"
              type="button"
              onClick={submitLogin}
            >
              เข้าสู่ระบบ
            </button>

            <button
              className="btn-ios-plain w-full"
              type="button"
              onClick={onClose}
            >
              ยกเลิก
            </button>

            <button
              type="button"
              onClick={autoFillDemo}
              className="text-[11px] text-amber-400/80 hover:text-amber-300 mt-1"
            >
              กดเติมรหัส 43210344 อัตโนมัติ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
