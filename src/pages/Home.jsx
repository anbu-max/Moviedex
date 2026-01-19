import { useState, useEffect, useCallback, useRef } from "react";
import MovieCard from "../components/MovieCard";
import "../css/Home.css";

function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [sciFiMovies, setSciFiMovies] = useState([]);
  const [webSeries, setWebSeries] = useState([]);
  const [animatedMovies, setAnimatedMovies] = useState([]);
  const [horrorMovies, setHorrorMovies] = useState([]);
  const [romanceMovies, setRomanceMovies] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const trendingRef = useRef(null);
  const sciFiRef = useRef(null);
  const webSeriesRef = useRef(null);
  const animatedRef = useRef(null);
  const horrorRef = useRef(null);
  const romanceRef = useRef(null);

  const API_KEY = import.meta.env.VITE_DB_API_KEY;

  // Enhanced fetch that gets detailed movie info
  const fetchMovies = useCallback(async (searchTerm) => {
    try {
      const res1 = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${searchTerm}&page=1`);
      const data1 = await res1.json();

      const res2 = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${searchTerm}&page=2`);
      const data2 = await res2.json();

      const allMovies = [...(data1.Search || []), ...(data2.Search || [])];

      // Get detailed info for each movie
      const detailedMovies = await Promise.all(
        allMovies.slice(0, 12).map(async (movie) => { // Limit to 12 to avoid API rate limits
          try {
            const detailRes = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${movie.imdbID}&plot=short`);
            const detailData = await detailRes.json();

            return {
              ...movie,
              Plot: detailData.Plot,
              Director: detailData.Director,
              Actors: detailData.Actors,
              Genre: detailData.Genre,
              Runtime: detailData.Runtime,
              Rated: detailData.Rated,
              imdbRating: detailData.imdbRating,
              Awards: detailData.Awards
            };
          } catch (error) {
            console.warn(`Failed to get details for ${movie.Title}:`, error);
            return movie; // Return basic info if detailed fetch fails
          }
        })
      );

      return detailedMovies;
    } catch (err) {
      console.error("Error fetching movies:", err);
      return [];
    }
  }, [API_KEY]);

  // Fetch trending movies (popular movies)
  const fetchTrendingMovies = useCallback(async () => {
    try {
      // Use popular search terms to simulate trending movies
      const trendingQueries = ["2024", "marvel", "avatar", "batman", "spider-man"];
      const allTrendingMovies = [];

      for (const query of trendingQueries) {
        if (allTrendingMovies.length >= 15) break; // Limit to 15 movies

        try {
          const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${query}&page=1`);
          const data = await res.json();

          if (data.Search) {
            // Get detailed info for the first movie from each search
            const movie = data.Search[0];
            if (movie) {
              const detailRes = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${movie.imdbID}&plot=short`);
              const detailData = await detailRes.json();

              allTrendingMovies.push({
                ...movie,
                Plot: detailData.Plot,
                Director: detailData.Director,
                Genre: detailData.Genre,
                imdbRating: detailData.imdbRating
              });
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch trending movies for ${query}:`, error);
        }
      }

      // Remove duplicates based on imdbID
      const uniqueMovies = allTrendingMovies.filter((movie, index, self) =>
        index === self.findIndex(m => m.imdbID === movie.imdbID)
      );

      return uniqueMovies.slice(0, 12); // Return max 12 movies
    } catch (err) {
      console.error("Error fetching trending movies:", err);
      return [];
    }
  }, [API_KEY]);

  // Fetch movies by category
  const fetchCategoryMovies = useCallback(async (searchTerms, limit = 8) => {
    try {
      const allMovies = [];

      for (const term of searchTerms) {
        if (allMovies.length >= limit) break;

        try {
          const res = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${term}&page=1`);
          const data = await res.json();

          if (data.Search) {
            // Get detailed info for movies
            for (const movie of data.Search.slice(0, 3)) {
              if (allMovies.length >= limit) break;

              try {
                const detailRes = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${movie.imdbID}&plot=short`);
                const detailData = await detailRes.json();

                allMovies.push({
                  ...movie,
                  Plot: detailData.Plot,
                  Director: detailData.Director,
                  Genre: detailData.Genre,
                  imdbRating: detailData.imdbRating
                });
              } catch {
                // If detailed fetch fails, add basic info
                allMovies.push(movie);
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch movies for ${term}:`, error);
        }
      }

      // Remove duplicates based on imdbID
      const uniqueMovies = allMovies.filter((movie, index, self) =>
        index === self.findIndex(m => m.imdbID === movie.imdbID)
      );

      return uniqueMovies.slice(0, limit);
    } catch (err) {
      console.error("Error fetching category movies:", err);
      return [];
    }
  }, [API_KEY]);

  // Auto-scroll functionality for carousels
  const setupAutoScroll = useCallback((ref, movies, delay = 0, interval = 6000) => {
    if (movies.length > 0 && ref.current) {
      const startAutoScroll = () => {
        const intervalId = setInterval(() => {
          if (ref.current) {
            const scrollAmount = 280; // Smoother scroll amount
            const maxScroll = ref.current.scrollWidth - ref.current.clientWidth;

            if (ref.current.scrollLeft >= maxScroll - 100) {
              ref.current.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
              ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
          }
        }, interval + delay);

        return intervalId;
      };

      const stopAutoScroll = (intervalId) => {
        if (intervalId) clearInterval(intervalId);
      };

      const timer = setTimeout(() => {
        const intervalId = startAutoScroll();

        const container = ref.current;
        const handleMouseEnter = () => stopAutoScroll(intervalId);
        const handleMouseLeave = () => {
          const newIntervalId = startAutoScroll();
          container.setAttribute('data-interval-id', newIntervalId);
        };

        container.addEventListener('mouseenter', handleMouseEnter);
        container.addEventListener('mouseleave', handleMouseLeave);
        container.setAttribute('data-interval-id', intervalId);

        // Cleanup function
        const cleanup = () => {
          stopAutoScroll(intervalId);
          container.removeEventListener('mouseenter', handleMouseEnter);
          container.removeEventListener('mouseleave', handleMouseLeave);
        };

        ref.current.cleanup = cleanup;
      }, 2000 + delay);

      return () => {
        clearTimeout(timer);
        if (ref.current && ref.current.cleanup) {
          ref.current.cleanup();
        }
      };
    }
  }, []);

  // Scroll carousel function for manual navigation
  const scrollCarousel = useCallback((ref, direction) => {
    if (ref.current) {
      ref.current.scrollBy({
        left: direction,
        behavior: 'smooth'
      });
    }
  }, []);

  // Setup auto-scroll for all carousels (trending slower at 8 seconds, others at 6 seconds)
  useEffect(() => setupAutoScroll(trendingRef, trendingMovies, 0, 8000), [trendingMovies, setupAutoScroll]);
  useEffect(() => setupAutoScroll(sciFiRef, sciFiMovies, 800, 6000), [sciFiMovies, setupAutoScroll]);
  useEffect(() => setupAutoScroll(webSeriesRef, webSeries, 1600, 6000), [webSeries, setupAutoScroll]);
  useEffect(() => setupAutoScroll(animatedRef, animatedMovies, 2400, 6000), [animatedMovies, setupAutoScroll]);
  useEffect(() => setupAutoScroll(horrorRef, horrorMovies, 3200, 6000), [horrorMovies, setupAutoScroll]);
  useEffect(() => setupAutoScroll(romanceRef, romanceMovies, 4000, 6000), [romanceMovies, setupAutoScroll]);

  // Home / popular movies
  useEffect(() => {
    const loadPopularMovies = async () => {
      setLoading(true);
      try {
        const popularMovies = await fetchMovies("adventure"); // default popular movies
        setMovies(popularMovies);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Failed to load Movies");
      } finally {
        setLoading(false);
      }
    };

    loadPopularMovies();
  }, [fetchMovies]);

  // Load trending movies
  useEffect(() => {
    const loadTrendingMovies = async () => {
      setTrendingLoading(true);
      try {
        const trending = await fetchTrendingMovies();
        setTrendingMovies(trending);
      } catch (err) {
        console.error("Failed to load trending movies:", err);
      } finally {
        setTrendingLoading(false);
      }
    };

    loadTrendingMovies();
  }, [fetchTrendingMovies]);

  // Load category movies
  useEffect(() => {
    const loadCategoryMovies = async () => {
      setCategoriesLoading(true);
      try {
        const results = await Promise.all([
          fetchCategoryMovies(["sci-fi", "alien", "space", "future"], 8),
          fetchCategoryMovies(["breaking bad", "stranger things", "game of thrones", "the office"], 8),
          fetchCategoryMovies(["animation", "disney", "pixar", "animated"], 8),
          fetchCategoryMovies(["horror", "thriller", "nightmare", "ghost"], 8),
          fetchCategoryMovies(["romance", "love", "romantic", "love story"], 8)
        ]);

        const [sciFi, web, animated, horror, romance] = results;

        setSciFiMovies(sciFi);
        setWebSeries(web);
        setAnimatedMovies(animated);
        setHorrorMovies(horror);
        setRomanceMovies(romance);
      } catch (err) {
        console.error("Failed to load category movies:", err);
      } finally {
        setCategoriesLoading(false);
      }
    };

    loadCategoryMovies();
  }, [fetchCategoryMovies]);

  // Search handler (minimal change)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (loading) return;

    setLoading(true);
    try {
      const searchResults = await fetchMovies(searchQuery);
      setMovies(searchResults);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to search Movies..");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      {/* Trending Movies Carousel */}
      {!trendingLoading && trendingMovies.length > 0 && (
        <div className="trending-section">
          <h2 className="trending-title">Trending Now 🔥</h2>
          <div className="trending-carousel-container">
            <button
              className="scroll-btn scroll-left"
              onClick={() => scrollCarousel(trendingRef, -300)}
              aria-label="Scroll left"
            >
              ‹
            </button>
            <div className="trending-carousel" ref={trendingRef}>
              <div className="trending-grid">
                {trendingMovies.map((movie) => (
                  <div key={movie.imdbID} className="trending-item">
                    <MovieCard movie={movie} />
                  </div>
                ))}
              </div>
            </div>
            <button
              className="scroll-btn scroll-right"
              onClick={() => scrollCarousel(trendingRef, 300)}
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          placeholder="Search movies.."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="search-button">Search</button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {/* Category Carousels */}
      {!categoriesLoading && (
        <>
          {/* Sci-Fi Movies */}
          {sciFiMovies.length > 0 && (
            <div className="category-section">
              <h2 className="category-title">🚀 Sci-Fi Adventures</h2>
              <div className="category-carousel-container">
                <button
                  className="scroll-btn scroll-left"
                  onClick={() => scrollCarousel(sciFiRef, -300)}
                  aria-label="Scroll left"
                >
                  ‹
                </button>
                <div className="category-carousel" ref={sciFiRef}>
                  <div className="category-grid">
                    {sciFiMovies.map((movie) => (
                      <div key={movie.imdbID} className="category-item">
                        <MovieCard movie={movie} />
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  className="scroll-btn scroll-right"
                  onClick={() => scrollCarousel(sciFiRef, 300)}
                  aria-label="Scroll right"
                >
                  ›
                </button>
              </div>
            </div>
          )}

          {/* Web Series */}
          {webSeries.length > 0 && (
            <div className="category-section">
              <h2 className="category-title">📺 Popular Web Series</h2>
              <div className="category-carousel-container">
                <button
                  className="scroll-btn scroll-left"
                  onClick={() => scrollCarousel(webSeriesRef, -300)}
                  aria-label="Scroll left"
                >
                  ‹
                </button>
                <div className="category-carousel" ref={webSeriesRef}>
                  <div className="category-grid">
                    {webSeries.map((movie) => (
                      <div key={movie.imdbID} className="category-item">
                        <MovieCard movie={movie} />
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  className="scroll-btn scroll-right"
                  onClick={() => scrollCarousel(webSeriesRef, 300)}
                  aria-label="Scroll right"
                >
                  ›
                </button>
              </div>
            </div>
          )}

          {/* Animated Movies */}
          {animatedMovies.length > 0 && (
            <div className="category-section">
              <h2 className="category-title">🎨 Animated Wonders</h2>
              <div className="category-carousel-container">
                <button
                  className="scroll-btn scroll-left"
                  onClick={() => scrollCarousel(animatedRef, -300)}
                  aria-label="Scroll left"
                >
                  ‹
                </button>
                <div className="category-carousel" ref={animatedRef}>
                  <div className="category-grid">
                    {animatedMovies.map((movie) => (
                      <div key={movie.imdbID} className="category-item">
                        <MovieCard movie={movie} />
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  className="scroll-btn scroll-right"
                  onClick={() => scrollCarousel(animatedRef, 300)}
                  aria-label="Scroll right"
                >
                  ›
                </button>
              </div>
            </div>
          )}

          {/* Horror Movies */}
          {horrorMovies.length > 0 && (
            <div className="category-section">
              <h2 className="category-title">👻 Horror Classics</h2>
              <div className="category-carousel-container">
                <button
                  className="scroll-btn scroll-left"
                  onClick={() => scrollCarousel(horrorRef, -300)}
                  aria-label="Scroll left"
                >
                  ‹
                </button>
                <div className="category-carousel" ref={horrorRef}>
                  <div className="category-grid">
                    {horrorMovies.map((movie) => (
                      <div key={movie.imdbID} className="category-item">
                        <MovieCard movie={movie} />
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  className="scroll-btn scroll-right"
                  onClick={() => scrollCarousel(horrorRef, 300)}
                  aria-label="Scroll right"
                >
                  ›
                </button>
              </div>
            </div>
          )}

          {/* Romance Movies */}
          {romanceMovies.length > 0 && (
            <div className="category-section">
              <h2 className="category-title">💖 Romantic Tales</h2>
              <div className="category-carousel-container">
                <button
                  className="scroll-btn scroll-left"
                  onClick={() => scrollCarousel(romanceRef, -300)}
                  aria-label="Scroll left"
                >
                  ‹
                </button>
                <div className="category-carousel" ref={romanceRef}>
                  <div className="category-grid">
                    {romanceMovies.map((movie) => (
                      <div key={movie.imdbID} className="category-item">
                        <MovieCard movie={movie} />
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  className="scroll-btn scroll-right"
                  onClick={() => scrollCarousel(romanceRef, 300)}
                  aria-label="Scroll right"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {loading ? (
        <div className="loading">Loading.....</div>
      ) : (
        <div className="movies-grid">
          {movies.map((movie) => (
            <MovieCard movie={movie} key={movie.imdbID} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;