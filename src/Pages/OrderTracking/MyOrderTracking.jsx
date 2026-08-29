import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../Context/Auth';
import { usePost } from '../../Hooks/usePost';
import { ArrowLeft, Clock, ChefHat, CheckCircle, Truck, AlertCircle } from 'lucide-react';
import { useGet } from '../../Hooks/useGet';

const MyOrderTracking = () => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const { t } = useTranslation();
    const auth = useAuth();
    const navigate = useNavigate();
    const tableId = useSelector((state) => state.table?.data) || localStorage.getItem('table_id');
    const [orders, setOrders] = useState([]);
    const [totals, setTotals] = useState({ subtotal: 0, discount: 0, tax: 0, total: 0 });

    const {
        refetch: refetchLists,
        loading: loadingLists,
        data: listsData,
        error: listsError
    } = useGet({
        url: tableId
            ? `${apiUrl}/client/order/dine_in_table_order/${tableId}`
            : null,
    });

    // Fetch orders on mount
    useEffect(() => {
        if (!tableId) {
            auth.toastError(t('Table ID not found. Please scan QR code first.'));
            navigate('/qr_scan', { replace: true });
            return;
        }
        refetchLists();
    }, [tableId]);

    // Handle API response
    useEffect(() => {
        if (listsData && !loadingLists) {
            if (listsData.success) {
                console.log('Orders data:', listsData.success);
                setOrders(listsData.success);

                // Calculate totals
                const subtotal = listsData.success.reduce(
                    (sum, item) => sum + Number(item.price) * Number(item.count),
                    0
                );
                const discount = listsData.success.reduce(
                    (sum, item) => sum + Number(item.discount_val) * Number(item.count),
                    0
                );
                const tax = listsData.success.reduce(
                    (sum, item) => sum + Number(item.tax_val) * Number(item.count),
                    0
                );
                const total = listsData.success.reduce(
                    (sum, item) => sum + Number(item.price_after_tax) * Number(item.count),
                    0
                );

                setTotals({ subtotal, discount, tax, total });
            } else if (listsData.error) {
                console.error('API Error:', listsData.error);
                auth.toastError(t('Failed to load orders'));
            }
        }
    }, [listsData, loadingLists]);

    // Fixed status mapping - corrected "waiting" spelling
    const statusConfig = {
        waiting: {
            label: t('Waiting'),
            icon: Clock,
            color: 'text-yellow-500',
            bg: 'bg-yellow-100',
            border: 'border-yellow-300'
        },
        preparing: {
            label: t('Preparing'),
            icon: ChefHat,
            color: 'text-blue-500',
            bg: 'bg-blue-100',
            border: 'border-blue-300'
        },
        done: {
            label: t('Done'),
            icon: CheckCircle,
            color: 'text-green-500',
            bg: 'bg-green-100',
            border: 'border-green-300'
        },
        pick_up: {
            label: t('Pick Up'),
            icon: Truck,
            color: 'text-purple-500',
            bg: 'bg-purple-100',
            border: 'border-purple-300'
        },
    };

    // Get progress for timeline with safe status handling
    const getProgress = (status) => {
        const statuses = ['waiting', 'preparing', 'done', 'pick_up'];
        const normalizedStatus = status?.toLowerCase() || 'waiting';
        const index = statuses.indexOf(normalizedStatus);
        return index >= 0 ? ((index + 1) / statuses.length) * 100 : 0;
    };

    // Get current status with fallback
    const getCurrentStatus = (order) => {
        const status = order.prepration?.toLowerCase() || 'waiting';
        return statusConfig[status] || statusConfig.waiting;
    };

    // Format price display
    const formatPrice = (price) => {
        return Number(price).toFixed(2);
    };

    if (loadingLists) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-mainColor mx-auto mb-4"></div>
                    <p className="text-gray-600">{t('Loading your orders...')}</p>
                </div>
            </div>
        );
    }

    if (listsError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{t('Failed to load orders')}</h3>
                <p className="text-gray-600 text-center mb-6">{t('Please try again later')}</p>
                <button
                    onClick={refetchLists}
                    className="bg-mainColor text-white px-6 py-3 rounded-lg hover:bg-mainColor/90 transition-colors"
                >
                    {t('Retry')}
                </button>
            </div>
        );
    }

    if (!orders.length && !loadingLists) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center max-w-md w-full">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ChefHat className="h-10 w-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('No Orders Found')}</h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                        {t('You haven\'t placed any orders yet. Start by adding items to your cart!')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={() => navigate('/menu')}
                            className="flex-1 bg-mainColor text-white px-6 py-3 rounded-lg font-semibold hover:bg-mainColor/90 transition-colors shadow-sm"
                        >
                            {t('Browse Menu')}
                        </button>
                        <button
                            onClick={() => navigate('/cart')}
                            className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                        >
                            {t('View Cart')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="w-full px-4 md:px-6 lg:px-8 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200 flex-shrink-0"
                            title={t('Back')}
                        >
                            <ArrowLeft className="h-6 w-6 text-gray-600" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-bold text-mainColor truncate">
                                {t('Order Tracking')}
                            </h1>
                            <p className="text-gray-500 text-sm mt-1">
                                {t('Tracking')} {orders.length} {orders.length === 1 ? t('item') : t('items')}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full px-4 md:px-6 lg:px-8 py-6 lg:py-8">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
                    {/* Order Items */}
                    <div className="xl:col-span-2 space-y-6">
                        {orders.map((order, index) => {
                            const currentStatus = getCurrentStatus(order);
                            const StatusIcon = currentStatus.icon;

                            return (
                                <div
                                    key={`${order.cart_id}-${order.id}-${index}`}
                                    className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300"
                                >
                                    <div className="p-4 sm:p-6">
                                        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                                            {/* Product Image */}
                                            <div className="lg:w-32 lg:h-32 w-full h-48 flex-shrink-0 relative">
                                                <img
                                                    src={order.image_link}
                                                    alt={order.name}
                                                    className="w-full h-full object-cover rounded-xl shadow-sm"
                                                    onError={(e) => {
                                                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5YzlkYWEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIwLjM1ZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                                                    }}
                                                />
                                                {/* Status Badge */}
                                                <div className={`absolute -top-2 -left-2 ${currentStatus.bg} ${currentStatus.border} border-2 rounded-full px-3 py-1 flex items-center gap-2 shadow-sm`}>
                                                    <StatusIcon className={`h-4 w-4 ${currentStatus.color}`} />
                                                    <span className={`text-sm font-semibold ${currentStatus.color}`}>
                                                        {currentStatus.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Product Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                                                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2">
                                                        {order.name}
                                                    </h3>
                                                    <span className="text-xl font-bold text-mainColor whitespace-nowrap">
                                                        {formatPrice(order.price_after_tax)} EGP
                                                    </span>
                                                </div>

                                                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                                    {order.description}
                                                </p>

                                                {/* Customizations */}
                                                <div className="space-y-2 mb-4">
                                                    {order.variation_selected?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            <span className="text-sm font-medium text-gray-700">{t('Variations')}:</span>
                                                            {order.variation_selected.map((variation) => (
                                                                <span key={variation.id} className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                                    {variation.name}: {variation.options.map((opt) => opt.name).join(', ')}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {order.excludes?.length > 0 && (
                                                        <div className="flex flex-wrap items-center gap-1">
                                                            <span className="text-sm font-medium text-gray-700">{t('Excludes')}:</span>
                                                            {order.excludes.map((ex) => (
                                                                <span key={ex.id} className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded line-through">
                                                                    {ex.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {order.extras?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            <span className="text-sm font-medium text-gray-700">{t('Extras')}:</span>
                                                            {order.extras.map((ex) => (
                                                                <span key={ex.id} className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                                                                    +{ex.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {order.addons_selected?.length > 0 && (
                                                        <div className="flex flex-wrap gap-1">
                                                            <span className="text-sm font-medium text-gray-700">{t('Addons')}:</span>
                                                            {order.addons_selected.map((addon) => (
                                                                <span key={addon.id} className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                                    +{addon.name}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Price and Quantity */}
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-gray-100">
                                                    <div className="flex flex-wrap items-center gap-3 text-sm">
                                                        <span className="text-gray-700 font-medium">
                                                            {t('Quantity')}: <span className="text-gray-900">{order.count}</span>
                                                        </span>
                                                        {order.discount_val > 0 && (
                                                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded">
                                                                {t('Discount')}: -{formatPrice(order.discount_val)} EGP
                                                            </span>
                                                        )}
                                                        {order.tax_val > 0 && (
                                                            <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                                                {t('Tax')}: +{formatPrice(order.tax_val)} EGP
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Progress Timeline */}
                                                <div className="mt-6 pt-4 border-t border-gray-100">
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-4">{t('Order Progress')}</h4>
                                                    <div className="relative">
                                                        {/* Progress Bar */}
                                                        <div className="absolute top-3 left-0 right-0 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-mainColor transition-all duration-700 ease-out"
                                                                style={{ width: `${getProgress(order.prepration)}%` }}
                                                            ></div>
                                                        </div>

                                                        {/* Status Steps */}
                                                        <div className="relative flex justify-between">
                                                            {Object.entries(statusConfig).map(([statusKey, config], idx) => {
                                                                const Icon = config.icon;
                                                                const isActive = getProgress(order.prepration) >= ((idx + 1) / 4) * 100;
                                                                const isCurrent = order.prepration?.toLowerCase() === statusKey;

                                                                return (
                                                                    <div key={statusKey} className="flex flex-col items-center">
                                                                        <div
                                                                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive
                                                                                ? `${config.bg} ${config.border} shadow-sm`
                                                                                : 'bg-gray-100 border-gray-300'
                                                                                } ${isCurrent ? 'scale-110 ring-2 ring-offset-2 ring-mainColor/30' : ''}`}
                                                                        >
                                                                            <Icon className={`h-4 w-4 ${isActive ? config.color : 'text-gray-400'}`} />
                                                                        </div>
                                                                        <span className={`text-xs mt-2 font-medium text-center max-w-16 ${isActive ? 'text-gray-900' : 'text-gray-500'
                                                                            }`}>
                                                                            {config.label}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Order Summary */}
                    <div className="xl:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-24">
                            <div className="p-6">
                                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">
                                    {t('Order Summary')}
                                </h2>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-gray-700">
                                        <span className="font-medium">
                                            {t('Subtotal')} ({orders.length} {orders.length === 1 ? t('item') : t('items')})
                                        </span>
                                        <span className="font-semibold">{formatPrice(totals.subtotal)} EGP</span>
                                    </div>

                                    {totals.discount > 0 && (
                                        <div className="flex justify-between items-center text-green-600">
                                            <span className="font-medium">{t('Discount')}</span>
                                            <span className="font-semibold">-{formatPrice(totals.discount)} EGP</span>
                                        </div>
                                    )}

                                    {totals.tax > 0 && (
                                        <div className="flex justify-between items-center text-orange-600">
                                            <span className="font-medium">{t('Tax')}</span>
                                            <span className="font-semibold">+{formatPrice(totals.tax)} EGP</span>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-200 pt-4">
                                        <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                                            <span>{t('Total Amount')}</span>
                                            <span className="text-mainColor">{formatPrice(totals.total)} EGP</span>
                                        </div>
                                    </div>
                                </div>

                                {/* <div className="mt-8 space-y-3">
                                    <button
                                        onClick={() => navigate('/cart')}
                                        className="w-full bg-mainColor text-white py-3.5 rounded-xl font-bold hover:bg-mainColor/90 transition-colors duration-200 shadow-sm hover:shadow-md"
                                    >
                                        {t('Back to Cart')}
                                    </button>
                                    <button
                                        onClick={() => navigate('/menu')}
                                        className="w-full border border-gray-300 text-gray-700 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200"
                                    >
                                        {t('Add More Items')}
                                    </button>
                                </div> */}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyOrderTracking;