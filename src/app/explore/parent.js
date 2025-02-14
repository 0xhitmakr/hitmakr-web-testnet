import React from "react";
import MainFooter from "../components/footer/MainFooter";
import HomeExplorer from "../subcomps/explorer";
import Collection from "../subcomps/explorer/collection";
import Genre from "../subcomps/explorer/genere";
import CategoryContent from "./category/category-content";
import GenreContent from "./genre/genre-content";

const ExploreLayout = ({ searchParams }) => {
  return (
    <section className="childLayout">
      {!searchParams?.explore_type ? (
        <React.Fragment>
          <HomeExplorer title="Explore All">
            <Collection />
          </HomeExplorer>
          <HomeExplorer title="Sounds by Genre">
            <Genre />
          </HomeExplorer>
        </React.Fragment>
      ) : (
        <React.Fragment>
          {searchParams.explore_type === "genre" ? (
            <GenreContent searchParams={searchParams} />
          ) : (
            <CategoryContent searchParams={searchParams} />
          )}
        </React.Fragment>
      )}
      <MainFooter />
    </section>
  );
};

export default ExploreLayout;
