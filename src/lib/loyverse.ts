// Интеграция с Loyverse API

const LOYVERSE_API_BASE = 'https://api.loyverse.com';
const LOYVERSE_TOKEN_KEY = 'loyverse-api-token';
const LOYVERSE_PROXY_KEY = 'loyverse-proxy-url';
const CUSTOMER_CACHE_KEY = 'loyverse-customer-cache';
const RECEIPT_CACHE_KEY = 'loyverse-receipt-cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 минут кеша

// Получить URL прокси (если настроен)
const getProxyUrl = (): string | null => {
  try {
    return localStorage.getItem(LOYVERSE_PROXY_KEY);
  } catch (e) {
    return null;
  }
};

// Получить базовый URL для запросов
const getApiBaseUrl = (): string => {
  const proxy = getProxyUrl();
  if (proxy) {
    return proxy.endsWith('/') ? proxy.slice(0, -1) : proxy;
  }
  return LOYVERSE_API_BASE;
};

export interface LoyverseCustomer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  balance: number;
  created_at?: string;
  updated_at?: string;
}

export interface LoyverseReceipt {
  id: string;
  receipt_number?: string;
  receipt_number_prefix?: string;
  receipt_number_suffix?: string;
  customer_id?: string;
  customer?: {
    id: string;
    name: string;
    balance?: number;
  };
  total_price?: number;
  created_at?: string;
}

export interface LoyverseApiResponse<T> {
  customers?: T[];
  receipts?: T[];
  cursor?: string;
}

interface CachedCustomer {
  customer: LoyverseCustomer;
  timestamp: number;
}

interface CachedReceipt {
  receipt: LoyverseReceipt;
  customer: LoyverseCustomer | null;
  timestamp: number;
}

// Получить API токен из настроек
export const getLoyverseToken = (): string | null => {
  try {
    return localStorage.getItem(LOYVERSE_TOKEN_KEY);
  } catch (e) {
    console.error('Failed to get Loyverse token', e);
    return null;
  }
};

// Сохранить API токен
export const setLoyverseToken = (token: string): void => {
  localStorage.setItem(LOYVERSE_TOKEN_KEY, token);
};

// Поиск чека по номеру в Loyverse
export const findReceiptByNumber = async (receiptNumber: string): Promise<{
  receipt: LoyverseReceipt;
  customer: LoyverseCustomer | null;
}> => {
  const token = getLoyverseToken();
  if (!token) {
    throw new Error('Loyverse API token not configured');
  }

  // Проверяем кеш
  const cached = getCachedReceipt(receiptNumber);
  if (cached) {
    return {
      receipt: cached.receipt,
      customer: cached.customer,
    };
  }

  try {
    // Ищем чек через API (с поддержкой прокси)
    const proxy = getProxyUrl();
    const apiBase = getApiBaseUrl();
    // Ищем чек по номеру (может быть в разных форматах)
    const cleanReceiptNumber = receiptNumber.trim().replace(/[^0-9]/g, '');
    const url = proxy 
      ? `${apiBase}/api/loyverse/receipts?receipt_number=${encodeURIComponent(receiptNumber)}`
      : `${apiBase}/v1.0/receipts?limit=100`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Если используется прокси, токен передается через заголовок
    if (proxy) {
      headers['X-Loyverse-Token'] = token;
    } else {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API token. Please check your Loyverse token.');
      }
      throw new Error(`Loyverse API error: ${response.status}`);
    }

    const data: LoyverseApiResponse<LoyverseReceipt> = await response.json();
    
    if (data.receipts && data.receipts.length > 0) {
      // Ищем чек по номеру (может быть в разных форматах)
      let receipt: LoyverseReceipt | null = null;
      
      for (const r of data.receipts) {
        const fullReceiptNumber = `${r.receipt_number_prefix || ''}${r.receipt_number || ''}${r.receipt_number_suffix || ''}`;
        const receiptNum = fullReceiptNumber.replace(/[^0-9]/g, '');
        
        if (receiptNum === cleanReceiptNumber || 
            fullReceiptNumber.toLowerCase().includes(receiptNumber.toLowerCase()) ||
            r.id === receiptNumber) {
          receipt = r;
          break;
        }
      }
      
      // Если не нашли в первой странице, пробуем поискать по ID
      if (!receipt && receiptNumber.length > 10) {
        // Возможно, это ID чека
        const directUrl = proxy
          ? `${apiBase}/api/loyverse/receipts/${receiptNumber}`
          : `${apiBase}/v1.0/receipts/${receiptNumber}`;
        
        const directResponse = await fetch(directUrl, {
          method: 'GET',
          headers,
        });
        
        if (directResponse.ok) {
          receipt = await directResponse.json();
        }
      }
      
      if (!receipt) {
        // Если не нашли точное совпадение, берем первый
        receipt = data.receipts[0];
      }
      
      // Получаем информацию о клиенте из чека
      let customer: LoyverseCustomer | null = null;
      
      if (receipt.customer_id || receipt.customer) {
        const customerId = receipt.customer_id || receipt.customer?.id;
        if (customerId) {
          try {
            customer = await getCustomerById(customerId);
          } catch (e) {
            console.warn('Failed to fetch customer details:', e);
            // Если не удалось получить клиента, используем данные из чека
            if (receipt.customer) {
              customer = {
                id: receipt.customer.id,
                name: receipt.customer.name,
                balance: receipt.customer.balance || 0,
              };
            }
          }
        }
      }
      
      // Сохраняем в кеш
      cacheReceipt(receiptNumber, receipt, customer);
      
      return {
        receipt,
        customer,
      };
    }

    throw new Error('Receipt not found. Please check the receipt number.');
  } catch (error: any) {
    console.error('Error fetching receipt from Loyverse:', error);
    // Улучшенная обработка ошибок с понятными сообщениями
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.name === 'TypeError') {
      throw new Error('CORS Error: Loyverse API blocks browser requests. The token may be correct, but API requires server-side access. Try checking balance - if it works, token is valid.');
    }
    if (error.message?.includes('401') || error.message?.includes('Invalid')) {
      throw new Error('Invalid API token. Please check your token in Loyverse Dashboard → Settings → API');
    }
    if (error.message?.includes('not found')) {
      throw error;
    }
    throw error;
  }
};

// Получить клиента по ID
const getCustomerById = async (customerId: string): Promise<LoyverseCustomer | null> => {
  const token = getLoyverseToken();
  if (!token) {
    return null;
  }

  try {
    const proxy = getProxyUrl();
    const apiBase = getApiBaseUrl();
    const url = proxy
      ? `${apiBase}/api/loyverse/customers/${customerId}`
      : `${apiBase}/v1.0/customers/${customerId}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (proxy) {
      headers['X-Loyverse-Token'] = token;
    } else {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      return await response.json();
    }
    
    return null;
  } catch (e) {
    console.error('Error fetching customer by ID:', e);
    return null;
  }
};

// Поиск клиента по имени в Loyverse (оставляем для обратной совместимости)
export const findCustomerByName = async (name: string): Promise<LoyverseCustomer | null> => {
  const token = getLoyverseToken();
  if (!token) {
    throw new Error('Loyverse API token not configured');
  }

  // Проверяем кеш
  const cached = getCachedCustomer(name);
  if (cached) {
    return cached;
  }

  try {
    // Ищем клиента через API (с поддержкой прокси)
    const proxy = getProxyUrl();
    const apiBase = getApiBaseUrl();
    const url = proxy ? `${apiBase}/api/loyverse/customers?name=${encodeURIComponent(name)}` : `${apiBase}/v1.0/customers?name=${encodeURIComponent(name)}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Если используется прокси, токен передается через заголовок
    if (proxy) {
      headers['X-Loyverse-Token'] = token;
    } else {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Invalid API token. Please check your Loyverse token.');
      }
      throw new Error(`Loyverse API error: ${response.status}`);
    }

    const data: LoyverseApiResponse<LoyverseCustomer> = await response.json();
    
    if (data.customers && data.customers.length > 0) {
      // Ищем точное совпадение имени (case-insensitive)
      const exactMatch = data.customers.find(
        c => c.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
      
      const customer = exactMatch || data.customers[0];
      
      // Сохраняем в кеш
      cacheCustomer(name, customer);
      
      return customer;
    }

    return null;
  } catch (error: any) {
    console.error('Error fetching customer from Loyverse:', error);
    // Улучшенная обработка ошибок с понятными сообщениями
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError') || error.name === 'TypeError') {
      throw new Error('CORS Error: Loyverse API blocks browser requests. The token may be correct, but API requires server-side access. Try checking balance - if it works, token is valid.');
    }
    if (error.message?.includes('401') || error.message?.includes('Invalid')) {
      throw new Error('Invalid API token. Please check your token in Loyverse Dashboard → Settings → API');
    }
    throw error;
  }
};

// Получить баланс клиента по номеру чека
export const getCustomerBalanceByReceipt = async (receiptNumber: string): Promise<number> => {
  const { customer } = await findReceiptByNumber(receiptNumber);
  return customer?.balance || 0;
};

// Получить баланс клиента (по имени, для обратной совместимости)
export const getCustomerBalance = async (name: string): Promise<number> => {
  const customer = await findCustomerByName(name);
  return customer?.balance || 0;
};

// Проверить, может ли клиент крутить колесо по номеру чека
export const canCustomerSpinByReceipt = async (receiptNumber: string): Promise<{
  allowed: boolean;
  reason?: string;
  balance?: number;
  customer?: LoyverseCustomer;
  receipt?: LoyverseReceipt;
}> => {
  const MINIMUM_BALANCE = 700;
  
  try {
    const { receipt, customer } = await findReceiptByNumber(receiptNumber);
    
    if (!receipt) {
      return {
        allowed: false,
        reason: 'Receipt not found in Loyverse. Please check the receipt number or contact staff.',
      };
    }
    
    if (!customer) {
      return {
        allowed: false,
        reason: 'Customer not found for this receipt. Please contact staff.',
        receipt,
      };
    }
    
    const balance = customer.balance || 0;
    
    if (balance < MINIMUM_BALANCE) {
      return {
        allowed: false,
        reason: `Minimum balance required: ₱${MINIMUM_BALANCE}. Customer balance: ₱${balance.toFixed(2)}`,
        balance,
        customer,
        receipt,
      };
    }
    
    return {
      allowed: true,
      balance,
      customer,
      receipt,
    };
  } catch (error: any) {
    // Детальная обработка ошибок для пользователя
    let errorMessage = error.message || 'Failed to check customer balance.';
    
    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
      errorMessage = 'CORS Error: Loyverse API blocks browser requests. Token may be correct, but needs server proxy. Check console for details.';
    } else if (error.message?.includes('401') || error.message?.includes('Invalid token')) {
      errorMessage = 'Invalid API token. Please check your token in Settings.';
    } else if (error.message?.includes('token not configured')) {
      errorMessage = 'API token not configured. Please enter token in Settings → Loyverse API Settings.';
    } else if (error.message?.includes('not found')) {
      errorMessage = error.message;
    }
    
    return {
      allowed: false,
      reason: errorMessage,
    };
  }
};

// Проверить, может ли клиент крутить колесо (по имени, для обратной совместимости)
export const canCustomerSpin = async (name: string): Promise<{
  allowed: boolean;
  reason?: string;
  balance?: number;
  customer?: LoyverseCustomer;
}> => {
  const MINIMUM_BALANCE = 700;
  
  try {
    const customer = await findCustomerByName(name);
    
    if (!customer) {
      return {
        allowed: false,
        reason: 'Customer not found in Loyverse. Please check the name or contact staff.',
      };
    }
    
    const balance = customer.balance || 0;
    
    if (balance < MINIMUM_BALANCE) {
      return {
        allowed: false,
        reason: `Minimum balance required: ₱${MINIMUM_BALANCE}. Your balance: ₱${balance.toFixed(2)}`,
        balance,
        customer,
      };
    }
    
    return {
      allowed: true,
      balance,
      customer,
    };
  } catch (error: any) {
    // Детальная обработка ошибок для пользователя
    let errorMessage = error.message || 'Failed to check customer balance.';
    
    if (error.message?.includes('CORS') || error.message?.includes('Failed to fetch')) {
      errorMessage = 'CORS Error: Loyverse API blocks browser requests. Token may be correct, but needs server proxy. Check console for details.';
    } else if (error.message?.includes('401') || error.message?.includes('Invalid token')) {
      errorMessage = 'Invalid API token. Please check your token in Settings.';
    } else if (error.message?.includes('token not configured')) {
      errorMessage = 'API token not configured. Please enter token in Settings → Loyverse API Settings.';
    }
    
    return {
      allowed: false,
      reason: errorMessage,
    };
  }
};

// Кеширование клиентов
const getCachedCustomer = (name: string): LoyverseCustomer | null => {
  try {
    const cached = localStorage.getItem(CUSTOMER_CACHE_KEY);
    if (cached) {
      const cache: Record<string, CachedCustomer> = JSON.parse(cached);
      const customerCache = cache[name.toLowerCase()];
      
      if (customerCache && (Date.now() - customerCache.timestamp) < CACHE_DURATION) {
        return customerCache.customer;
      }
    }
  } catch (e) {
    // Игнорируем ошибки кеша
  }
  return null;
};

const cacheCustomer = (name: string, customer: LoyverseCustomer): void => {
  try {
    const cached = localStorage.getItem(CUSTOMER_CACHE_KEY);
    const cache: Record<string, CachedCustomer> = cached ? JSON.parse(cached) : {};
    
    cache[name.toLowerCase()] = {
      customer,
      timestamp: Date.now(),
    };
    
    // Очищаем старые записи (старше 1 часа)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    Object.keys(cache).forEach(key => {
      if (cache[key].timestamp < oneHourAgo) {
        delete cache[key];
      }
    });
    
    localStorage.setItem(CUSTOMER_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // Игнорируем ошибки кеша
  }
};

// Кеширование чеков
const getCachedReceipt = (receiptNumber: string): CachedReceipt | null => {
  try {
    const cached = localStorage.getItem(RECEIPT_CACHE_KEY);
    if (cached) {
      const cache: Record<string, CachedReceipt> = JSON.parse(cached);
      const receiptCache = cache[receiptNumber.toLowerCase()];
      
      if (receiptCache && (Date.now() - receiptCache.timestamp) < CACHE_DURATION) {
        return receiptCache;
      }
    }
  } catch (e) {
    // Игнорируем ошибки кеша
  }
  return null;
};

const cacheReceipt = (receiptNumber: string, receipt: LoyverseReceipt, customer: LoyverseCustomer | null): void => {
  try {
    const cached = localStorage.getItem(RECEIPT_CACHE_KEY);
    const cache: Record<string, CachedReceipt> = cached ? JSON.parse(cached) : {};
    
    cache[receiptNumber.toLowerCase()] = {
      receipt,
      customer,
      timestamp: Date.now(),
    };
    
    // Очищаем старые записи (старше 1 часа)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    Object.keys(cache).forEach(key => {
      if (cache[key].timestamp < oneHourAgo) {
        delete cache[key];
      }
    });
    
    localStorage.setItem(RECEIPT_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // Игнорируем ошибки кеша
  }
};

// Очистить кеш
export const clearCustomerCache = (): void => {
  localStorage.removeItem(CUSTOMER_CACHE_KEY);
  localStorage.removeItem(RECEIPT_CACHE_KEY);
};

// Установить URL прокси-сервера
export const setProxyUrl = (url: string): void => {
  if (url) {
    localStorage.setItem(LOYVERSE_PROXY_KEY, url);
  } else {
    localStorage.removeItem(LOYVERSE_PROXY_KEY);
  }
};

// Получить URL прокси-сервера (экспортируемая версия)
export const getProxyUrlSetting = (): string | null => {
  return getProxyUrl();
};

// Тест подключения к API
export const testLoyverseConnection = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  const token = getLoyverseToken();
  if (!token) {
    return {
      success: false,
      message: 'API token not configured',
    };
  }

  try {
    const apiBase = getApiBaseUrl();
    const proxy = getProxyUrl();
    const url = proxy ? `${apiBase}/api/loyverse/test` : `${apiBase}/v1.0/customers?limit=1`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (proxy) {
      headers['X-Loyverse-Token'] = token;
    } else {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      return {
        success: true,
        message: 'Successfully connected to Loyverse API ✓',
      };
    } else if (response.status === 401) {
      return {
        success: false,
        message: 'Invalid API token. Please check your token in Loyverse Dashboard.',
      };
    } else if (response.status === 403) {
      return {
        success: false,
        message: 'Access forbidden. Check token permissions in Loyverse.',
      };
    } else {
      const errorText = await response.text().catch(() => '');
      return {
        success: false,
        message: `API error (${response.status}): ${errorText || 'Unknown error'}`,
      };
    }
  } catch (error: any) {
    // Обработка CORS и сетевых ошибок
    if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
      return {
        success: false,
        message: 'Network error. Check your internet connection and CORS settings. Loyverse API may require server-side proxy.',
      };
    }
    if (error.message?.includes('CORS')) {
      return {
        success: false,
        message: 'CORS error. Loyverse API may block browser requests. Consider using a proxy server.',
      };
    }
    return {
      success: false,
      message: error.message || 'Failed to connect to Loyverse API. Check token and network.',
    };
  }
};
