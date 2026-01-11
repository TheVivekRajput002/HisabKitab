import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 12, fontSize: 15, fontFamily: 'Helvetica' },
    createdAtCorner: { position: 'absolute', bottom: 10, left: 10, fontSize: 11, color: '#6b7280' },
    headerContainer: { marginBottom: 0 },
    headerGrid: { flexDirection: 'row', borderBottom: 2, borderColor: '#d1d5db' },
    companySection: { width: '100%', padding: 15 },
    companyHeader: { flexDirection: 'row', gap: 10 },
    logoBox: { width: 50, height: 50, backgroundColor: '#fbbf24', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
    logoText: { fontSize: 29, color: '#1f2937', fontFamily: 'Helvetica-Bold' },
    companyDetails: { flex: 1 },
    companyName: { fontSize: 21, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 4 },
    companyAddress: { fontSize: 14, color: '#4b5563', marginBottom: 2 },
    invoiceTitle: { fontSize: 19, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 6, textAlign: 'center', marginTop: 8 },
    customerSection: { padding: 7, paddingBottom: 7, backgroundColor: '#eff6ff', borderBottom: 2, borderColor: '#d1d5db' },
    customerGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 15 },
    customerColumn: { width: '30%' },
    customerInfoText: { paddingLeft: 5 },
    customerTextLine: { fontSize: 15, marginBottom: 4, color: '#111827' },
    customerLabel: { fontFamily: 'Helvetica-Bold', color: '#374151' },
    customerValue: { fontFamily: 'Helvetica', color: '#111827' },
    itemsSection: { padding: 10 },
    table: { borderWidth: 2, borderColor: '#d1d5db', borderRadius: 4 },
    tableHeader: { flexDirection: 'row', borderBottom: 2, borderColor: '#d1d5db', color: '#000000', padding: 8, fontFamily: 'Helvetica-Bold', fontSize: 14 },
    tableRow: { flexDirection: 'row', borderBottom: 1, borderColor: '#d1d5db', padding: 8, fontSize: 13 },
    col1: { width: '10%', textAlign: 'center' },
    col2: { width: '30%' },
    col3: { width: '12%' },
    col4: { width: '10%', textAlign: 'center' },
    col5: { width: '13%', textAlign: 'right' },
    col6: { width: '10%', textAlign: 'center' },
    col7: { width: '20%', textAlign: 'right' },
    totalSection: { padding: 3, backgroundColor: '#f9fafb' },
    totalGrid: { flexDirection: 'row', gap: 20, alignItems: 'flex-start' },
    termsPlaceholder: { width: '50%', paddingRight: 10 },
    termsSectionInline: { padding: 6, backgroundColor: '#f9fafb' },
    termsTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#1f2937', marginBottom: 8 },
    termItem: { fontSize: 10, color: '#4b5563', marginBottom: 2, paddingLeft: 10 },
    gstBreakdownBox: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4, padding: 6, backgroundColor: '#f9fafb', marginBottom: 4 },
    gstBreakdownItem: { marginBottom: 4 },
    gstBreakdownHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
    gstRateLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#4b5563' },
    gstTotalAmount: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#2563eb' },
    gstDetailsGrid: { flexDirection: 'row', gap: 4 },
    gstDetailBox: { flex: 1, backgroundColor: '#ffffff', borderRadius: 3, padding: 4 },
    gstDetailLabel: { fontSize: 10, color: '#6b7280' },
    gstDetailValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#374151' },
    gstSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4, marginTop: 3, borderTop: 1, borderColor: '#d1d5db' },
    gstSummaryLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#374151' },
    gstSummaryValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#2563eb' },
    totalsContainer: { width: '50%', paddingLeft: 10 },
    totalsBox: { width: '100%' },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottom: 1, borderColor: '#d1d5db' },
    totalLabel: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#374151' },
    totalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#111827' },
    grandTotalRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1f2937', color: '#ffffff', padding: 6, borderRadius: 4, marginTop: 5 },
    grandTotalLabel: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
    grandTotalValue: { fontSize: 14, fontFamily: 'Helvetica-Bold' },
    paymentModeBelow: { flexDirection: 'row', width: '100%', marginTop: 10, marginLeft: 'auto', alignItems: 'center' },
    fieldLabel: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#374151', marginBottom: 3, width: '50%' },
    paymentBadge: { padding: 4, backgroundColor: '#ffffff', borderRadius: 3, borderWidth: 2, borderColor: '#e5e7eb', width: '50%' },
    paymentBadgeInner: { padding: 3, borderRadius: 10, fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
    paymentPaid: { backgroundColor: '#d1fae5', color: '#065f46' },
    paymentUnpaid: { backgroundColor: '#fef3c7', color: '#92400e' },
    footerSection: { padding: 8, borderTop: 2, borderColor: '#d1d5db' },
    signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    signatureBox: { width: '45%' },
    signatureText: { fontSize: 13, color: '#6b7280', textAlign: 'center' },
    footerNote: { marginTop: 8, textAlign: 'center', fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }
});

const InvoicePDF = ({ isInvoice, pageHead, invoice, customer, products, gstIncluded }) => {
    const calculateSubtotal = () => {
        return products.reduce((sum, product) => {
            if (gstIncluded) {
                const basePrice = product.rate / (1 + product.gstPercentage / 100);
                return sum + (product.quantity * basePrice);
            } else {
                return sum + (product.quantity * product.rate);
            }
        }, 0);
    };

    const calculateTotalGST = () => {
        return products.reduce((sum, product) => {
            if (gstIncluded) {
                const basePrice = product.rate / (1 + product.gstPercentage / 100);
                const gstAmount = product.rate - basePrice;
                return sum + (product.quantity * gstAmount);
            } else {
                const base = product.quantity * product.rate;
                const gst = (base * product.gstPercentage) / 100;
                return sum + gst;
            }
        }, 0);
    };

    const calculateGrandTotal = () => {
        return calculateSubtotal() + calculateTotalGST();
    };

    const calculateGSTDistribution = () => {
        const distribution = {};
        products.forEach(product => {
            let baseAmount, gstAmount;
            if (gstIncluded) {
                const basePrice = product.rate / (1 + product.gstPercentage / 100);
                baseAmount = product.quantity * basePrice;
                gstAmount = (product.quantity * product.rate) - baseAmount;
            } else {
                baseAmount = product.quantity * product.rate;
                gstAmount = (baseAmount * product.gstPercentage) / 100;
            }
            if (product.gstPercentage > 0) {
                const gstKey = `${product.gstPercentage}%`;
                if (!distribution[gstKey]) {
                    distribution[gstKey] = { rate: product.gstPercentage, taxableAmount: 0, cgst: 0, sgst: 0, totalGst: 0 };
                }
                distribution[gstKey].taxableAmount += baseAmount;
                distribution[gstKey].cgst += gstAmount / 2;
                distribution[gstKey].sgst += gstAmount / 2;
                distribution[gstKey].totalGst += gstAmount;
            }
        });
        return Object.values(distribution);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN');
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.createdAtCorner}>{new Date(invoice.created_at).toLocaleString('en-IN')}</Text>

                <View style={styles.headerContainer}>
                    <Text style={styles.invoiceTitle}>{pageHead}</Text>
                    <View style={styles.headerGrid}>
                        <View style={styles.companySection}>
                            <View style={styles.companyHeader}>
                                <View style={styles.logoBox}>
                                    <Text style={styles.logoText}>SS</Text>
                                </View>
                                <View style={styles.companyDetails}>
                                    <Text style={styles.companyName}>Shiv Shakti Automobile</Text>
                                    <Text style={styles.companyAddress}>Near new Bus Stand, Vidisha, M.P.</Text>
                                    <Text style={styles.companyAddress}>Mobile No. - 9993646020</Text>
                                    <Text style={styles.companyAddress}>GST: 23AYKPR3166N1ZV</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.customerSection}>
                    <View style={styles.customerInfoText}>
                        <View style={styles.customerGrid}>
                            <View style={styles.customerColumn}>
                                <Text style={styles.customerTextLine}>
                                    <Text style={styles.customerLabel}>Name: </Text>
                                    <Text style={styles.customerValue}>{customer?.name || 'N/A'}</Text>
                                </Text>
                                <Text style={styles.customerTextLine}>
                                    <Text style={styles.customerLabel}>Phone: </Text>
                                    <Text style={styles.customerValue}>{customer?.phone_number || 'N/A'}</Text>
                                </Text>
                                {invoice.gstin && (
                                    <Text style={styles.customerTextLine}>
                                        <Text style={styles.customerLabel}>GSTIN: </Text>
                                        <Text style={styles.customerValue}>{invoice.gstin}</Text>
                                    </Text>
                                )}
                            </View>
                            <View style={styles.customerColumn}>
                                <Text style={styles.customerTextLine}>
                                    <Text style={styles.customerLabel}>Vehicle / Mechanic: </Text>
                                    <Text style={styles.customerValue}>{customer?.vehicle || 'N/A'}</Text>
                                </Text>
                                <Text style={styles.customerTextLine}>
                                    <Text style={styles.customerLabel}>Address: </Text>
                                    <Text style={styles.customerValue}>{customer?.address || 'N/A'}</Text>
                                </Text>
                            </View>
                            <View style={styles.customerColumn}>
                                <Text style={styles.customerTextLine}>
                                    <Text style={styles.customerLabel}>Invoice No: </Text>
                                    <Text style={styles.customerValue}>{invoice.invoice_number || invoice.estimate_number}</Text>
                                </Text>
                                <Text style={styles.customerTextLine}>
                                    <Text style={styles.customerLabel}>Invoice Date: </Text>
                                    <Text style={styles.customerValue}>{formatDate(invoice.bill_date)}</Text>
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={styles.itemsSection}>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={styles.col1}>S.No</Text>
                            <Text style={styles.col2}>Product Name</Text>
                            <Text style={styles.col3}>HSN</Text>
                            <Text style={styles.col4}>Qty</Text>
                            <Text style={styles.col5}>Rate</Text>
                            <Text style={styles.col6}>GST %</Text>
                            <Text style={styles.col7}>Amount</Text>
                        </View>
                        {products.map((product, index) => {
                            const rate = Number(product.rate) || 0;
                            const totalAmount = Number(product.totalAmount) || 0;

                            return (
                                <View key={product.id} style={styles.tableRow}>
                                    <Text style={styles.col1}>{String(index + 1)}</Text>
                                    <Text style={styles.col2}>{String(product.productName)}</Text>
                                    <Text style={styles.col3}>{String(product.hsnCode)}</Text>
                                    <Text style={styles.col4}>{String(product.quantity)}</Text>
                                    <Text style={styles.col5}>₹{rate.toFixed(2)}</Text>
                                    <Text style={styles.col6}>{String(product.gstPercentage)}%</Text>
                                    <Text style={styles.col7}>₹{totalAmount.toFixed(2)}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

                <View style={styles.totalSection}>
                    <View style={styles.totalGrid}>
                        <View style={styles.termsPlaceholder}>
                            <View style={{ ...styles.termsSectionInline, padding: 6, paddingTop: 0, paddingBottom: 0 }}>
                                <Text style={{ ...styles.termsTitle, marginBottom: 4 }}>Terms & Conditions</Text>
                                <Text style={styles.termItem}>• Errors and omissions are subject to correction.</Text>
                                <Text style={styles.termItem}>• Goods once sold will not be taken back or exchanged.</Text>
                                <Text style={{ ...styles.termItem, marginBottom: 0 }}>• Subject to Vidisha Jurisdiction.</Text>
                            </View>
                            {calculateGSTDistribution().length > 0 && (
                                <View style={{ ...styles.gstBreakdownBox, marginTop: 6 }}>
                                    {calculateGSTDistribution().map((gst, index) => (
                                        <View key={index} style={styles.gstBreakdownItem}>
                                            <View style={styles.gstBreakdownHeader}>
                                                <Text style={styles.gstRateLabel}>GST @ {String(gst.rate)}%</Text>
                                                <Text style={styles.gstTotalAmount}>₹{gst.totalGst.toFixed(2)}</Text>
                                            </View>
                                            <View style={styles.gstDetailsGrid}>
                                                <View style={styles.gstDetailBox}>
                                                    <Text style={styles.gstDetailLabel}>Taxable</Text>
                                                    <Text style={styles.gstDetailValue}>₹{gst.taxableAmount.toFixed(2)}</Text>
                                                </View>
                                                <View style={styles.gstDetailBox}>
                                                    <Text style={styles.gstDetailLabel}>CGST</Text>
                                                    <Text style={styles.gstDetailValue}>₹{gst.cgst.toFixed(2)}</Text>
                                                </View>
                                                <View style={styles.gstDetailBox}>
                                                    <Text style={styles.gstDetailLabel}>SGST</Text>
                                                    <Text style={styles.gstDetailValue}>₹{gst.sgst.toFixed(2)}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                    <View style={styles.gstSummaryRow}>
                                        <Text style={styles.gstSummaryLabel}>Total GST:</Text>
                                        <Text style={styles.gstSummaryValue}>₹{calculateTotalGST().toFixed(2)}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                        <View style={styles.totalsContainer}>
                            <View style={styles.totalsBox}>
                                <View style={styles.totalRow}>
                                    <Text style={styles.totalLabel}>Subtotal:</Text>
                                    <Text style={styles.totalValue}>₹{calculateSubtotal().toFixed(2)}</Text>
                                </View>
                                <View style={styles.grandTotalRow}>
                                    <Text style={styles.grandTotalLabel}>GRAND TOTAL:</Text>
                                    <Text style={styles.grandTotalValue}>₹{calculateGrandTotal().toFixed(2)}</Text>
                                </View>
                            </View>
                            {isInvoice && (
                                <View style={styles.paymentModeBelow}>
                                    <Text style={styles.fieldLabel}>Payment Mode</Text>
                                    <View style={styles.paymentBadge}>
                                        <View style={[
                                            styles.paymentBadgeInner,
                                            invoice.mode_of_payment === 'cash' || invoice.mode_of_payment === 'online' ? styles.paymentPaid : styles.paymentUnpaid
                                        ]}>
                                            <Text>{invoice.mode_of_payment ? invoice.mode_of_payment.toUpperCase() : 'UNPAID'}</Text>
                                        </View>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                <View style={styles.footerSection}>
                    <View style={styles.signatureRow}>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureText}>Customer Signature</Text>
                        </View>
                        <View style={styles.signatureBox}>
                            <Text style={styles.signatureText}>Authorized Signature</Text>
                        </View>
                    </View>
                    <Text style={styles.footerNote}>
                        This is a computer-generated invoice and does not require a physical signature.
                    </Text>
                </View>
            </Page>
        </Document>
    );
};

export default InvoicePDF;