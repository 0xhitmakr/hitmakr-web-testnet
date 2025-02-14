import { useRouter } from "next/navigation";

const useSetSearchParams = () => {
  const router = useRouter();

  const setSearchParams = (params) => {
    const currentParams = new URLSearchParams(window.location.search);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        currentParams.delete(key);
      } else {
        currentParams.set(key, value);
      }
    });

    router.push(`?${currentParams.toString()}`, { scroll: true });
  };

  return setSearchParams;
};

export default useSetSearchParams;
