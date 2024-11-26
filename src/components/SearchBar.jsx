import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, TrendingUp, Users, X, Tag } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, startAt, endAt, getDocs } from 'firebase/firestore';
import debounce from 'lodash/debounce';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';

const SEARCH_HISTORY_KEY = 'msme-search-history';
const CATEGORIES = [
  { id: 'all', name: 'All Categories' },
  { id: 'technology', name: 'Technology' },
  { id: 'business', name: 'Business' },
  { id: 'creative', name: 'Creative' },
  { id: 'education', name: 'Education' },
  { id: 'entertainment', name: 'Entertainment' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'health', name: 'Health' },
  { id: 'lifestyle', name: 'Lifestyle' },
  { id: 'science', name: 'Science' },
];

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');
  const [trendingTopics, setTrendingTopics] = useState([]);
  const searchRef = useRef(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Load search history from localStorage
  useEffect(() => {
    if (currentUser) {
      const history = localStorage.getItem(`${SEARCH_HISTORY_KEY}-${currentUser.uid}`);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    }
  }, [currentUser]);

  // Load trending topics
  useEffect(() => {
    const fetchTrendingTopics = async () => {
      try {
        const topicsRef = collection(db, 'topics');
        const trendingQuery = query(
          topicsRef,
          orderBy('memberCount', 'desc'),
          limit(5)
        );
        const snapshot = await getDocs(trendingQuery);
        const trending = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTrendingTopics(trending);
      } catch (error) {
        console.error('Error fetching trending topics:', error);
      }
    };

    fetchTrendingTopics();
  }, []);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToHistory = (searchTerm) => {
    if (currentUser && searchTerm.trim()) {
      const newHistory = [
        searchTerm,
        ...searchHistory.filter(item => item !== searchTerm)
      ].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem(
        `${SEARCH_HISTORY_KEY}-${currentUser.uid}`, 
        JSON.stringify(newHistory)
      );
    }
  };

  const clearHistory = (e) => {
    e.stopPropagation();
    setSearchHistory([]);
    localStorage.removeItem(`${SEARCH_HISTORY_KEY}-${currentUser.uid}`);
  };

  // Inside your debouncedSearch function:

const debouncedSearch = debounce(async (searchQuery, category, sort) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
  
    try {
      const topicsRef = collection(db, 'topics');
      let topicsQuery;
  
      // Convert search query to lowercase for case-insensitive search
      const searchLower = searchQuery.toLowerCase();
  
      // Basic query
      if (category !== 'all') {
        topicsQuery = query(
          topicsRef,
          where('category', '==', category)
        );
      } else {
        topicsQuery = query(topicsRef);
      }
  
      // Get all documents that match the category (if specified)
      const snapshot = await getDocs(topicsQuery);
      
      // Filter results client-side for name matching
      let searchResults = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(topic => 
          topic.name.toLowerCase().includes(searchLower) ||
          topic.description.toLowerCase().includes(searchLower)
        );
  
      // Apply sorting
      switch (sort) {
        case 'members':
          searchResults = searchResults.sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0));
          break;
        case 'recent':
          searchResults = searchResults.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
          break;
        // Add more sort options as needed
      }
  
      console.log('Search results:', searchResults); // Debug log
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Error performing search');
    } finally {
      setLoading(false);
    }
  }, 300);

  const handleSearch = (e) => {
    const searchQuery = e.target.value;
    setQuery(searchQuery);

    if (searchQuery.trim().length > 0) {
      setLoading(true);
      setShowResults(true);
      debouncedSearch(searchQuery, selectedCategory, sortBy);
    } else {
      setShowResults(false);
      setResults([]);
    }
  };

  const navigateToTopic = (topic) => {
    saveToHistory(topic.name);
    navigate(`/topic/${topic.id}`);
    setShowResults(false);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setShowResults(false);
    }
  };

  return (
    <div className="relative flex-1 max-w-2xl mx-4" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-msme-sage/50" />
        <input
          type="text"
          value={query}
          onChange={handleSearch}
          onFocus={() => setShowResults(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search topics"
          className="w-full pl-10 pr-4 py-2 bg-msme-cream/30 border border-msme-sage/10 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-msme-gold/50 focus:border-transparent
                    placeholder:text-msme-sage/50 text-msme-sage"
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-msme-sage/10 max-h-[80vh] overflow-y-auto z-50">
          {/* Filters */}
          <div className="sticky top-0 bg-white border-b border-msme-sage/10 p-2">
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  if (query) debouncedSearch(query, e.target.value, sortBy);
                }}
                className="text-sm border rounded px-2 py-1 text-msme-sage bg-msme-cream/30 focus:outline-none focus:ring-2 focus:ring-msme-gold/50"
              >
                {CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  if (query) debouncedSearch(query, selectedCategory, e.target.value);
                }}
                className="text-sm border rounded px-2 py-1 text-msme-sage bg-msme-cream/30 focus:outline-none focus:ring-2 focus:ring-msme-gold/50"
              >
                <option value="relevance">Sort by Relevance</option>
                <option value="members">Most Members</option>
                <option value="recent">Most Recent</option>
              </select>
            </div>
          </div>

          {/* Search History */}
          {!query && searchHistory.length > 0 && (
            <div className="p-2 border-b border-msme-sage/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-msme-sage">Recent Searches</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearHistory}
                  className="text-xs text-msme-sage hover:text-msme-gold"
                >
                  Clear
                </Button>
              </div>
              <div className="space-y-1">
                {searchHistory.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(term);
                      debouncedSearch(term, selectedCategory, sortBy);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-left hover:bg-msme-cream/30 rounded-md group"
                  >
                    <Clock className="w-4 h-4 text-msme-sage/50 group-hover:text-msme-gold" />
                    <span className="text-sm text-msme-sage group-hover:text-msme-gold">
                      {term}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Trending Topics */}
          {!query && trendingTopics.length > 0 && (
            <div className="p-2 border-b border-msme-sage/10">
              <div className="flex items-center mb-2">
                <TrendingUp className="w-4 h-4 text-msme-sage/50 mr-1" />
                <span className="text-xs font-medium text-msme-sage">Trending Topics</span>
              </div>
              <div className="space-y-1">
                {trendingTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => navigateToTopic(topic)}
                    className="flex items-center justify-between w-full px-3 py-1.5 hover:bg-msme-cream/30 rounded-md group"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-msme-sage/50 group-hover:text-msme-gold" />
                      <span className="text-sm text-msme-sage group-hover:text-msme-gold">
                        {topic.name}
                      </span>
                    </div>
                    <span className="text-xs text-msme-sage/50">
                      {topic.memberCount.toLocaleString()} members
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {query && (
            <div className="p-2">
              {loading ? (
                <div className="flex justify-center p-4">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-msme-gold"></div>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => navigateToTopic(topic)}
                      className="flex items-center justify-between w-full px-3 py-2 hover:bg-msme-cream/30 rounded-md group"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-msme-sage group-hover:text-msme-gold">
                          {topic.name}
                        </span>
                        <span className="text-xs text-msme-sage/50 line-clamp-1">
                          {topic.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs text-msme-sage/50">
                          {topic.category}
                        </span>
                        <div className="flex items-center text-xs text-msme-sage/50">
                          <Users className="w-3 h-3 mr-1" />
                          {topic.memberCount.toLocaleString()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-msme-sage/70">
                  No topics found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;