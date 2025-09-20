import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AddInvestment = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to unified blog form with investments category
    navigate('/terminal/admin/blogs/add?category=investments', { replace: true });
  }, [navigate]);

  return (
    <div>
      Redirecting to unified content form...
    </div>
  );
};

export default AddInvestment;