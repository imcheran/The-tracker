export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support desktop notification');
    return;
  }
  if (Notification.permission !== 'denied') {
    await Notification.requestPermission();
  }
};

export const sendNotification = (title: string, body: string) => {
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};

export const playAlarmSound = () => {
  // Simple beep using Web Audio API to avoid external file deps
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
  gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

  oscillator.start();
  
  // Play a sequence
  setTimeout(() => oscillator.frequency.setValueAtTime(554.37, audioCtx.currentTime), 200); // C#5
  setTimeout(() => oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime), 400); // E5
  setTimeout(() => oscillator.stop(), 800);
};