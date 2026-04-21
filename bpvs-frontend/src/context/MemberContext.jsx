import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { apiGet } from "../api/api";
import { AuthContext } from "./AuthContext";
import { useDebounce } from "../hooks/useDebounce";

export const MemberContext = createContext();

export const MemberProvider = ({ children }) => {
  const { user } = useContext(AuthContext);

  // Full list cache (for dropdowns)
  const [cachedMembers, setCachedMembers] = useState([]);
  const [cachedPage, setCachedPage] = useState(0);
  const [cachedHasMore, setCachedHasMore] = useState(true);

  // Directory state (synchronized with BvpsMembers)
  const [directoryMembers, setDirectoryMembers] = useState([]);
  const [dirTotal, setDirTotal] = useState(0);
  const [dirLoading, setDirLoading] = useState(false);
  const [dirPage, setDirPage] = useState(1);
  const [dirHasMore, setDirHasMore] = useState(true);

  // Common UI states
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    tab: "All",
    days: null,
    status: "",
  });

  const debouncedSearch = useDebounce(searchQuery, 400);
  const debouncedFilters = useDebounce(filters, 300);

  /**
   * Fetch members from API with optional filters
   */
  const fetchFromApi = useCallback(
    async (pageNum, query = "", filterSet = {}) => {
      try {
        const { tab, days, status } = filterSet;
        const params = new URLSearchParams({
          page: pageNum,
          limit: 20,
          ...(query?.trim() && { search: query.trim() }),
          ...(tab && tab !== "All" && { tab }),
          ...(days != null && { days: String(days) }),
          ...(status && { status }),
        });

        const res = await apiGet(`/members?${params.toString()}`);
        if (res.success && res.data) {
          return {
            members: res.data.members || [],
            total: res.data.pagination?.total || 0,
            totalPages: res.data.pagination?.pages || 1,
            currentPage: res.data.pagination?.page || pageNum,
          };
        }
        return null;
      } catch (err) {
        console.error("Error fetching members:", err);
        return null;
      }
    },
    [],
  );

  /**
   * Global effect to handle Dropdown cache and Directory initial loads
   */
  useEffect(() => {
    if (!user) return;

    const loadInitial = async () => {
      setLoading(true);

      // 1. Handle Dropdown Cache (always active members, no search)
      if (
        !debouncedSearch &&
        debouncedFilters.tab === "All" &&
        !debouncedFilters.days &&
        !debouncedFilters.status
      ) {
        if (cachedMembers.length === 0) {
          const data = await fetchFromApi(1);
          if (data) {
            setCachedMembers(data.members);
            setCachedPage(1);
            setCachedHasMore(data.currentPage < data.totalPages);
          }
        }
      }

      // 2. Handle Directory (refresh on any filter change)
      setDirLoading(true);
      const dirData = await fetchFromApi(1, debouncedSearch, debouncedFilters);
      if (dirData) {
        setDirectoryMembers(dirData.members);
        setDirTotal(dirData.total);
        setDirPage(1);
        setDirHasMore(dirData.currentPage < dirData.totalPages);
      }
      setDirLoading(false);
      setLoading(false);
    };

    loadInitial();
  }, [user, debouncedSearch, debouncedFilters, fetchFromApi]);

  /**
   * Load More (Incremental) - Primarily for Dropdowns and Mobile Directory
   */
  const loadMore = async () => {
    if (loadingMore || loading) return;
    setLoadingMore(true);

    const isDropdownOnly =
      !debouncedSearch &&
      debouncedFilters.tab === "All" &&
      !debouncedFilters.days &&
      !debouncedFilters.status;

    if (isDropdownOnly) {
      if (!cachedHasMore) {
        setLoadingMore(false);
        return;
      }
      const next = cachedPage + 1;
      const data = await fetchFromApi(next);
      if (data) {
        setCachedMembers((prev) => [...prev, ...data.members]);
        setCachedPage(next);
        setCachedHasMore(data.currentPage < data.totalPages);
      }
    } else {
      // Load more for current filtered directory view
      if (!dirHasMore) {
        setLoadingMore(false);
        return;
      }
      const next = dirPage + 1;
      const data = await fetchFromApi(next, debouncedSearch, debouncedFilters);
      if (data) {
        setDirectoryMembers((prev) => [...prev, ...data.members]);
        setDirPage(next);
        setDirHasMore(data.currentPage < data.totalPages);
      }
    }
    setLoadingMore(false);
  };

  /**
   * Explicit Page Fetch (for Desktop Pagination)
   */
  const fetchPage = async (pageNum) => {
    setDirLoading(true);
    const data = await fetchFromApi(pageNum, debouncedSearch, debouncedFilters);
    if (data) {
      setDirectoryMembers(data.members);
      setDirPage(pageNum);
      setDirHasMore(pageNum < data.totalPages);
      setDirTotal(data.total);
    }
    setDirLoading(false);
  };

  return (
    <MemberContext.Provider
      value={{
        // For Dropdowns
        members: debouncedSearch ? directoryMembers : cachedMembers,
        loading,
        loadingMore,
        loadMore,
        hasMore: debouncedSearch ? dirHasMore : cachedHasMore,
        setSearchQuery,
        searchQuery,

        // For Directory (BvpsMembers)
        directoryMembers,
        dirTotal,
        dirLoading,
        dirPage,
        dirHasMore,
        fetchPage,
        filters,
        setFilters,
      }}
    >
      {children}
    </MemberContext.Provider>
  );
};
