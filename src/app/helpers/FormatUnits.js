
export const formatUnits = (value, decimals, displayDecimals = 2) => {
    try {
        const valueStr = value.toString();
        
        if (valueStr === '0') return '0.00';
        
        const pad = decimals - valueStr.length;
        
        const paddedValue = pad > 0 
            ? '0'.repeat(pad) + valueStr 
            : valueStr;
        
        const wholePart = paddedValue.slice(0, -decimals) || '0';
        const decimalPart = paddedValue.slice(-decimals);
        
        const formattedDecimal = decimalPart
            .slice(0, displayDecimals)
            .replace(/0+$/, ''); 
        
        return formattedDecimal 
            ? `${wholePart}.${formattedDecimal}`
            : wholePart;
    } catch (error) {
        console.error('Error formatting units:', error);
        return '0.00';
    }
};


export const formatWithCommas = (value) => {
    try {
        const parts = value.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        return parts.join('.');
    } catch (error) {
        console.error('Error formatting with commas:', error);
        return value;
    }
};


export const formatUSDC = (value, displayDecimals = 2) => {
    const formatted = formatUnits(value, 6, displayDecimals);
    return formatWithCommas(formatted);
};