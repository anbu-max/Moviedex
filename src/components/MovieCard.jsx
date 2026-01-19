import "../css/MovieCard.css"
import { useMovieContext} from "../contexts/MovieContext";


function MovieCard({ movie }) {

  const { addToFavorites, removeFromFavorites, isFavorite } = useMovieContext();
  const favorite = isFavorite(movie.id)



  function onFavoriteClick(e) {
    e.preventDefault()
    if (favorite) removeFromFavorites(movie.id);
    else addToFavorites(movie);

  }
  return (
    <div className="movie-card">
      <div className="movie-poster">  
        <img src={movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Poster"} alt={movie.Title} />
        <div className="movie-overlay">
          <button className={`favorite-btn ${favorite ? "active" : ""}`} onClick={onFavoriteClick}>
            ♥
          </button>
        </div>
      </div>
      <div className="movie-info">
        <h2 className="movie-title">{movie.Title}</h2>
        <p className="movie-year">{movie.Year}</p>
        {movie.Genre && (
          <p className="movie-genre">{movie.Genre}</p>
        )}
        {movie.imdbRating && movie.imdbRating !== "N/A" && (
          <p className="movie-rating">⭐ {movie.imdbRating}/10</p>
        )}
        {movie.Director && movie.Director !== "N/A" && (
          <p className="movie-director">Directed by {movie.Director}</p>
        )}
        {movie.Plot && movie.Plot !== "N/A" && (
          <p className="movie-plot">{movie.Plot}</p>
        )}
      </div>
    </div>
  );
}

export default MovieCard;
