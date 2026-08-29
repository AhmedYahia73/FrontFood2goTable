import React, { useEffect, useState } from 'react'
import { useGet } from '../../Hooks/useGet';
import { useSelector } from 'react-redux';

const PrivacyPolicy = () => {
    const mainData = useSelector(state => state.mainData?.data);
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const { refetch: refetchData, loading: loadingData, data } = useGet({
        url: `${apiUrl}/customer/home/policies`,
    });
    const [supportData, setSupportData] = useState(null);
    const [formattedSections, setFormattedSections] = useState([]);

    useEffect(() => {
        refetchData();
    }, [refetchData]);

    useEffect(() => {
        if (data && data.policies) {
            setSupportData(data.policies?.policy);
        }
    }, [data]);

    // Process and format the support data from API
    useEffect(() => {
        if (supportData) {
            const processSupportData = (content) => {
                if (!content) return [];
                
                const sections = content.split('\r\n\r\n');
                const processedSections = sections.map((section, index) => {
                    const lines = section.split('\r\n').filter(line => line.trim() !== '');
                    
                    return {
                        id: index,
                        lines: lines.map((line, lineIndex) => {
                            // Detect contact information
                            const emailMatch = line.match(/Email:\s*(.+)/i);
                            const phoneMatch = line.match(/Phone Number:\s*(.+)/i);
                            
                            if (emailMatch) {
                                return {
                                    type: 'email',
                                    label: 'Email',
                                    value: emailMatch[1].trim(),
                                    href: `https://mail.google.com/mail/?view=cm&fs=1&to=${emailMatch[1].trim()}`
                                };
                            }
                            
                            if (phoneMatch) {
                                return {
                                    type: 'phone',
                                    label: 'Phone Number',
                                    value: phoneMatch[1].trim(),
                                    href: `tel:${phoneMatch[1].trim()}`
                                };
                            }
                            
                            // Detect headings (lines that are likely titles)
                            const isHeading = line.includes('Support') || 
                                            line.includes('Contact') || 
                                            line === lines[0] || // First line of section
                                            (line.length < 50 && !line.includes(':'));
                            
                            return {
                                type: isHeading ? 'heading' : 'paragraph',
                                content: line
                            };
                        })
                    };
                });
                
                return processedSections;
            };
            
            setFormattedSections(processSupportData(supportData));
        }
    }, [supportData]);

    // Render different line types
    const renderLine = (line, lineIndex) => {
        switch (line.type) {
            case 'heading':
                const isMainHeading = lineIndex === 0;
                return (
                    <h3 
                        key={lineIndex} 
                        className={`${isMainHeading ? 'text-2xl font-bold' : 'text-xl font-semibold mt-6'} mb-4 text-gray-900 border-b pb-2`}
                    >
                        {line.content}
                    </h3>
                );
                
            case 'paragraph':
                return (
                    <p key={lineIndex} className="text-gray-700 mb-3 leading-relaxed text-lg">
                        {line.content}
                    </p>
                );
                
            case 'email':
            case 'phone':
                return (
                    <div key={lineIndex} className="flex flex-wrap items-center mb-3 p-3 bg-gray-50 rounded-lg">
                        <strong className="text-gray-800 min-w-32 text-lg">{line.label}:</strong>
                        <a
                            href={line.href}
                            target={line.type === 'email' ? "_blank" : "_self"}
                            rel={line.type === 'email' ? "noopener noreferrer" : ""}
                            className="text-gray-600 hover:text-gray-800 transition-colors duration-200 ml-3 text-lg font-medium"
                        >
                            {line.value}
                        </a>
                    </div>
                );
                
            default:
                return (
                    <p key={lineIndex} className="text-gray-700 mb-3 leading-relaxed">
                        {line.content}
                    </p>
                );
        }
    };

    if (loadingData) {
        return (
            <div className="flex justify-center items-center min-h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-white shadow-lg rounded-xl">
            {/* Main Content from API */}
            <div className="space-y-3">
                {formattedSections.length > 0 ? (
                    formattedSections.map((section) => (
                        <div key={section.id} className="bg-white rounded-lg">
                            {section.lines.map((line, lineIndex) => 
                                renderLine(line, lineIndex)
                            )}
                        </div>
                    ))
                ) : supportData ? (
                    // Fallback: if parsing fails, show raw data with basic formatting
                    <div className="bg-gray-50 p-6 rounded-lg">
                        <pre className="whitespace-pre-wrap text-gray-700 text-lg">
                            {supportData}
                        </pre>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-12">
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-xl">No support information available</p>
                    </div>
                )}
            </div>

            {/* Logo Section */}
            {/* {mainData?.logo_link && (
                <div className="border-t border-gray-200">
                    <div className="w-48 h-32 mx-auto">
                        <img 
                            src={mainData.logo_link} 
                            alt={mainData?.name || "Company Logo"} 
                            className="w-full h-full object-contain"
                        />
                    </div>
                </div>
            )} */}
        </div>
    );
};

export default PrivacyPolicy;