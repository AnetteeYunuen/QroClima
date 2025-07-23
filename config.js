// Configuración centralizada para URLs de la API

// Cambia esta IP por la de tu computadora cuando sea necesario
// en cmd ejecuta ipconfig y busca la ip de tu red local
const IP = '192.168.107.185'; // Reemplaza con tu número real

// URLs de la API
const API_URL = `http://${IP}:5000`;

// Endpoints específicos
const API_ENDPOINTS = {
  login: `${API_URL}/api/users/login`,
  register: `${API_URL}/api/users/register`,
  reports: `${API_URL}/api/reports`,
  users: `${API_URL}/api/users`,
  // Agrega más endpoints
};

export { IP, API_URL, API_ENDPOINTS };