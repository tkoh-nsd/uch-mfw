console.log('Test script is running...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

import('firebase/app').then(() => {
  console.log('Firebase module loaded successfully');
}).catch(err => {
  console.error('Error loading Firebase:', err.message);
});

setTimeout(() => {
  console.log('Script completed');
  process.exit(0);
}, 2000);

