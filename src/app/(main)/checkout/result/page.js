'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react'

// Đảm bảo URL này khớp với cấu hình .env của bạn
const API_BASE_URL = 'http://127.0.0.1:8000';

export default function CheckoutResultPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // VNPay params
  const vnp_ResponseCode = searchParams.get('vnp_ResponseCode')
  const vnp_TxnRef = searchParams.get('vnp_TxnRef')
  const vnp_TransactionNo = searchParams.get('vnp_TransactionNo')
  
  // ✅ MỚI: Lấy số tiền từ URL VNPay (Lưu ý: VNPay nhân 100 nên cần chia 100)
  const vnp_Amount = searchParams.get('vnp_Amount') 

  const [status, setStatus] = useState('Pending')
  const [orderData, setOrderData] = useState(null)
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState(null)

  useEffect(() => {
    const fullUrl = typeof window !== 'undefined' ? window.location.href : '';

    console.log('🔥 === CHECKOUT RESULT DEBUG ===');
    console.log('📍 Full URL:', fullUrl);
    console.log('📍 vnp_ResponseCode:', vnp_ResponseCode);
    console.log('📍 vnp_TxnRef:', vnp_TxnRef);
    console.log('📍 vnp_Amount:', vnp_Amount);
    console.log('=================================');

    setDebugInfo({
      fullUrl,
      orderId: vnp_TxnRef,
      responseCode: vnp_ResponseCode || 'MISSING',
      transactionNo: vnp_TransactionNo,
    });

    if (!vnp_TxnRef) {
      console.error('❌ Missing vnp_TxnRef');
      setStatus('failed');
      setError('Thiếu thông tin giao dịch. Vui lòng thử lại.');
      return;
    }

    // VNPay: 00 = Thành công
    if (vnp_ResponseCode === '00') {
      console.log('✅ Payment SUCCESS (vnp_ResponseCode=00)');
      processVnpayOrder();
    } else if (vnp_ResponseCode === '24') {
      console.log('❌ Payment CANCELLED');
      setStatus('failed');
      setError('Bạn đã hủy giao dịch thanh toán.');
    } else if (vnp_ResponseCode) {
      console.log('❌ Payment FAILED, code:', vnp_ResponseCode);
      setStatus('failed');
      setError(getVnpayErrorMessage(vnp_ResponseCode));
    } else {
      console.warn('⚠️ Missing vnp_ResponseCode → Attempting fallback');
      processVnpayOrder();
    }
  }, [vnp_ResponseCode, vnp_TxnRef, searchParams]);

  const getVnpayErrorMessage = (code) => {
    const messages = {
      '07': 'Giao dịch bị nghi ngờ gian lận.',
      '09': 'Thẻ/Tài khoản chưa đăng ký Internet Banking.',
      '10': 'Xác thực thông tin thẻ không đúng quá 3 lần.',
      '11': 'Đã hết hạn chờ thanh toán.',
      '12': 'Thẻ/Tài khoản bị khóa.',
      '13': 'Nhập sai mật khẩu OTP.',
      '24': 'Bạn đã hủy giao dịch.',
      '51': 'Tài khoản không đủ số dư.',
      '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Lỗi không xác định.',
    };
    return messages[code] || `Thanh toán thất bại (Mã lỗi: ${code})`;
  };

  const processVnpayOrder = async () => {
    const params = new URLSearchParams(searchParams.toString());
    const apiUrl = `${API_BASE_URL}/api/orders/check-vnpay?${params.toString()}`;

    console.log('🚀 Processing VNPay order...');
    console.log('🔗 API URL:', apiUrl);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log('📊 Response status:', res.status);

      const data = await res.json();
      console.log('📦 Response JSON:', data);

      if (data.status) {
        console.log('✅✅✅ ORDER CREATED!');
        
        // --- XÓA GIỎ HÀNG ---
        if (typeof window !== 'undefined') {
            localStorage.removeItem('cart');
            localStorage.removeItem('pending_order_id');
            window.dispatchEvent(new Event('cart:update'));
        }
        // --------------------

        setStatus('success');
        setOrderData(data.order);
      } else {
        console.error('❌ API Error:', data.message);
        setStatus('failed');
        setError(data.message || 'Không thể tạo đơn hàng');
      }
    } catch (err) {
      console.error('❌❌❌ FETCH ERROR ❌❌❌');
      console.error('Error:', err);

      let errorMsg = 'Lỗi kết nối server';
      if (err.name === 'AbortError') {
        errorMsg = 'Timeout: Server phản hồi quá lâu';
      } else if (err.message.includes('Failed to fetch')) {
        errorMsg = 'Không thể kết nối đến server.';
      }

      setStatus('failed');
      setError(errorMsg);
    }
  };

  // ✅ MỚI: Hàm helper lấy giá tiền chuẩn nhất
  const getDisplayTotalMoney = () => {
    // Ưu tiên 1: Lấy từ Database trả về (Chính xác nhất)
    if (orderData && orderData.total_money) {
        return Number(orderData.total_money);
    }
    // Ưu tiên 2: Lấy từ URL VNPay trả về (Dự phòng)
    if (vnp_Amount) {
        return Number(vnp_Amount) / 100;
    }
    return 0;
  };

  // ============ UI ============

  if (status === 'Pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Đang xử lý đơn hàng...
            </h2>
            <p className="text-gray-600 mb-4">Vui lòng đợi trong giây lát</p>
          </div>

          {debugInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs font-bold text-blue-800 mb-2">🔍 Trạng thái: </p>
              <div className="space-y-1 text-xs font-mono text-blue-700">
                <p><strong>Order ID:</strong> {debugInfo.orderId}</p>
                <p>
                  <strong>Response Code:</strong>{' '}
                  <span className={debugInfo.responseCode === '00' ? 'text-green-600' : 'text-red-600'}>
                    {debugInfo.responseCode}
                  </span>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Thanh toán thất bại
            </h2>
            <p className="text-gray-600 mb-4">{error}</p>
          </div>

          {/* Debug info */}
          <div className="bg-gray-100 rounded-lg p-4 mb-6">
            <p className="text-xs font-bold text-gray-700 mb-2">🔍 Thông tin lỗi:</p>
            <div className="space-y-1 text-xs font-mono text-gray-600">
              <p><strong>Mã đơn: </strong> {debugInfo?.orderId || 'N/A'}</p>
              <p>
                <strong>Mã kết quả:</strong>{' '}
                <span className="text-red-600">{debugInfo?.responseCode || 'N/A'}</span>
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/cart')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Thử lại thanh toán
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Đặt hàng thành công! 🎉
          </h2>
          <p className="text-gray-600">Cảm ơn bạn đã mua hàng tại cửa hàng</p>
        </div>

        {/* Luôn hiển thị thông tin nếu có vnp_TxnRef hoặc orderData */}
        <div className="border-t border-gray-200 pt-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-semibold">
                  Đơn hàng #{orderData?.id || vnp_TxnRef} đã được xác nhận
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Mã đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900">#{orderData?.id || vnp_TxnRef}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng tiền</p>
                {/* ✅ SỬ DỤNG HÀM HIỂN THỊ TIỀN MỚI */}
                <p className="text-2xl font-bold text-green-600">
                  {getDisplayTotalMoney().toLocaleString('vi-VN')}₫
                </p>
              </div>
              
              {/* Chỉ hiển thị chi tiết khi orderData đã load xong */}
              {orderData && (
                <>
                    <div className="col-span-2">
                        <p className="text-sm text-gray-600 mb-1">Người nhận</p>
                        <p className="font-semibold text-gray-900">{orderData.name}</p>
                        <p className="text-sm text-gray-600">{orderData.phone}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-sm text-gray-600 mb-1">Địa chỉ giao hàng</p>
                        <p className="text-gray-900">{orderData.address}</p>
                    </div>
                </>
              )}
            </div>

            {orderData?.email && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 text-center">
                  ✉️ Email xác nhận đã được gửi đến: <strong>{orderData.email}</strong>
                </p>
              </div>
            )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push('/products')}
            className="flex-1 border-2 border-blue-600 text-blue-600 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Tiếp tục mua sắm
          </button>
          <button
            onClick={() => router.push('/')}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
}