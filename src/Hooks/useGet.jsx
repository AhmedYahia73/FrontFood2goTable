import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { removeTableId } from "../Store/Slices/tableSlice";

export const useGet = ({ url, required, autoFetch = false }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoFetch); // only true if autoFetch
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fetchData = useCallback(async () => {
    if (required === true) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "",
        },
      });
      if (response.status === 200) {
        setData(response.data);
      }
    } catch (error) {
      console.error("errorGet", error);
      if (
        error.response?.data?.message === "Unauthenticated." &&
        error.response?.status === 401
      ) {
        dispatch(removeTableId());
        localStorage.clear();
      }
    } finally {
      setLoading(false);
    }
  }, [url, navigate, dispatch]);

  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [fetchData, autoFetch]);

  return { refetch: fetchData, loading, data, required };
};
