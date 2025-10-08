const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      console.log('API Request:', config.method || 'GET', url);
      
      const response = await fetch(url, config);
      const data = await response.json();
      
      console.log('API Response:', response.status, data);

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error.message);
      throw error;
    }
  }

  // Métodos de autenticação
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: userData,
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: credentials,
    });
  }

  // Métodos de abrigos
  async createShelter(shelterData) {
    return this.request('/abrigos', {
      method: 'POST',
      body: shelterData,
    });
  }

  async getShelters() {
    return this.request('/abrigos');
  }

  // Métodos administrativos
  async getUsers() {
    return this.request('/users');
  }

  async testConnection() {
    return this.request('/test');
  }
}

export default new ApiService();