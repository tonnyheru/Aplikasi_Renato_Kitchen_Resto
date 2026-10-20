const API_BASE_URL = 'http://127.0.0.1:8000/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('renato_token');
}

export function setStoredToken(token: string): void {
  localStorage.setItem('renato_token', token);
}

export function removeStoredToken(): void {
  localStorage.removeItem('renato_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: Record<string, string[]> }> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Request failed with status ${response.status}`,
        errors: data.errors,
      };
    }

    return data;
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Koneksi ke backend gagal. Pastikan server aktif.',
    };
  }
}

// Rupiah Formatter
export function formatIDR(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// Date Formatter: DD/MM/YYYY HH:mm
export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const mins = pad(d.getMinutes());
  return `${day}/${month}/${year} ${hours}:${mins}`;
}
