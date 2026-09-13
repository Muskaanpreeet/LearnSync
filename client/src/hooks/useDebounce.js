import { useEffect, useState } from 'react';

// Delays updating the returned value until the user stops typing for
// `delay` ms — used on every search box so we don't fire an API call
// per keystroke (courses, students, teachers, assignments, etc.).
const useDebounce = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
};

export default useDebounce;
