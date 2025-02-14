import React from "react";
import CategoryList from "./category-list";
import { redirect } from "next/navigation";
import Header from "../header/header";

const collection = ["Music", "Sound", "Loop", "Instrumentals", "SFX"];

const CategoryContent = ({ searchParams }) => {
  if (!searchParams.explore_type) {
    redirect("/explore");
  }

  if (searchParams.explore_type?.toLowerCase() !== "explore") {
    redirect("/explore");
  }

  const isExploreTypeGood = collection.some(
    (item) => item.toLowerCase() === searchParams.category.toLowerCase()
  );

  if (!isExploreTypeGood) {
    redirect("/explore");
  }

  return (
    <React.Fragment>
      <Header searchParams={searchParams} />
      <CategoryList searchParams={searchParams} />
    </React.Fragment>
  );
};

export default CategoryContent;
