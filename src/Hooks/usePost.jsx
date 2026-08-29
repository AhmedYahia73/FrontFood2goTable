import axios from "axios";
import { useState } from "react";
import { useAuth } from "../Context/Auth"; // Make sure to import useAuth if required
import { useSelector } from "react-redux";
import { useTranslation } from 'react-i18next'; // <-- Importing useTranslation hook

export const usePost = ({ url, /* login = false, */ type = false }) => {
       const auth = useAuth();
       const user = useSelector(state => state?.user?.data || null)
       const [loadingPost, setLoadingPost] = useState(false);
       const [response, setResponse] = useState(null);
       const { t, i18n } = useTranslation(); // <-- use i18n to change language

       const postData = async (data, name) => {
              setLoadingPost(true);
              try {
                     const contentType = type ? 'application/json' : 'multipart/form-data';
                     const config = user?.token
                            ? {
                                   headers: {
                                          'Content-Type': contentType,
                                          'Authorization': `Bearer ${user?.token || ''}`,
                                   },
                            }
                            : {
                                   headers: { 'Content-Type': contentType },
                            };

                     const response = await axios.post(url, data, config);

                     if (response.status === 200) {
                            setResponse(response);
                            { name ? auth.toastSuccess(name) : '' }
                     }
              }
              catch (error) {
                     console.error('Error post JSON:', error);
                     // Special case: if this is the "processing order" error, throw it to be handled by the component
                     if (error?.response?.data?.errors === "You has order at proccessing") {
                            throw error;
                     }
                     // Check if the error response contains 'errors' or just a message
                     if (error?.response?.data?.errors) {
                            // Check if errors are an object (field-based errors)
                            if (typeof error.response.data.errors === 'object') {
                                   Object.entries(error.response.data.errors).forEach(([field, messages]) => {
                                          // If messages is an array, loop through them
                                          if (Array.isArray(messages)) {
                                                 messages.forEach(message => {
                                                        auth.toastError(message); // Display the error messages
                                                 });
                                          } else {
                                                 // If it's not an array, display the message directly
                                                 auth.toastError(messages);
                                          }
                                   });
                            } else {
                                   // If errors is not an object, assume it's just a message
                                   auth.toastError(error.response.data.errors);
                            }
                     } else if (error?.response?.data?.message) {
                            // If there's a general message outside of the 'errors' object
                            auth.toastError(error.response.data.message); // Display the general error message
                     } else if (error?.response?.data?.faield) {
                            // If there's a general message outside of the 'errors' object
                            auth.toastError(error.response.data.faield); // Display the general error message
                     }
                     else if (error?.response?.data?.faild) {
                            // If there's a general message outside of the 'errors' object
                            auth.toastError(error.response.data.faild); // Display the general error message
                     }
                     else {
                            // If no specific error messages are found, just display a fallback message
                            auth.toastError(t('An unknown error occurred.'));
                     }
              }

              finally {
                     setLoadingPost(false);
              }
       };

       return { postData, loadingPost, response };
};
