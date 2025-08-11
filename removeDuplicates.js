import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Remove all duplicate ingredients globally across all recipes
 * Only keeps the first occurrence of each ingredient in the entire dataset
 * @param {Array} recipes - Array of recipe objects
 * @returns {Object} Results with deduplicated recipes and stats
 */
function removeAllDuplicateIngredients(recipes) {
  const globalSeenIngredients = new Set();
  const stats = {
    totalRecipes: recipes.length,
    recipesModified: 0,
    totalIngredientsRemoved: 0,
    totalIngredientsBefore: 0,
    totalIngredientsAfter: 0,
    uniqueIngredientsKept: 0,
    removedIngredients: new Map(), // Track which ingredients were removed from which recipes
  };

  const deduplicatedRecipes = recipes.map((recipe, recipeIndex) => {
    const originalIngredients = recipe.ingredients || [];
    const filteredIngredients = [];
    let recipeModified = false;

    stats.totalIngredientsBefore += originalIngredients.length;

    for (const ingredient of originalIngredients) {
      if (!globalSeenIngredients.has(ingredient)) {
        // First time seeing this ingredient - keep it
        globalSeenIngredients.add(ingredient);
        filteredIngredients.push(ingredient);
        stats.uniqueIngredientsKept++;
      } else {
        // Duplicate ingredient - remove it
        stats.totalIngredientsRemoved++;
        recipeModified = true;

        // Track which ingredient was removed from which recipe
        if (!stats.removedIngredients.has(ingredient)) {
          stats.removedIngredients.set(ingredient, []);
        }
        stats.removedIngredients.get(ingredient).push({
          recipeId: recipe.id,
          recipeIndex: recipeIndex,
        });
      }
    }

    stats.totalIngredientsAfter += filteredIngredients.length;

    if (recipeModified) {
      stats.recipesModified++;
    }

    return {
      ...recipe,
      ingredients: filteredIngredients,
    };
  });

  return {
    recipes: deduplicatedRecipes,
    stats,
  };
}

/**
 * Analyze what duplicates exist before removal
 * @param {Array} recipes - Array of recipe objects
 * @returns {Object} Analysis of duplicates
 */
function analyzeGlobalDuplicates(recipes) {
  const ingredientOccurrences = new Map();
  const firstOccurrence = new Map();

  // Track all occurrences of each ingredient
  recipes.forEach((recipe, recipeIndex) => {
    const ingredients = recipe.ingredients || [];

    ingredients.forEach((ingredient) => {
      if (!ingredientOccurrences.has(ingredient)) {
        ingredientOccurrences.set(ingredient, []);
        firstOccurrence.set(ingredient, {
          recipeId: recipe.id,
          recipeIndex: recipeIndex,
        });
      }

      ingredientOccurrences.get(ingredient).push({
        recipeId: recipe.id,
        recipeIndex: recipeIndex,
      });
    });
  });

  // Find ingredients that appear in multiple places
  const duplicateIngredients = new Map();
  let totalDuplicates = 0;

  for (const [ingredient, occurrences] of ingredientOccurrences) {
    if (occurrences.length > 1) {
      duplicateIngredients.set(ingredient, {
        totalOccurrences: occurrences.length,
        duplicateCount: occurrences.length - 1, // -1 because we keep the first
        firstOccurrence: firstOccurrence.get(ingredient),
        allOccurrences: occurrences,
      });
      totalDuplicates += occurrences.length - 1;
    }
  }

  return {
    totalUniqueIngredients: ingredientOccurrences.size,
    duplicateIngredients,
    totalDuplicatesFound: totalDuplicates,
    ingredientsWithDuplicates: duplicateIngredients.size,
  };
}

/**
 * Main function to remove global duplicate ingredients
 * @param {string} inputFile - Path to input JSON file
 * @param {string} outputFile - Path to output JSON file (optional)
 * @param {Object} options - Processing options
 */
async function deduplicateGlobalIngredients(
  inputFile,
  outputFile = null,
  options = {}
) {
  try {
    const {
      previewOnly = false,
      showAnalysis = false,
      showRemovals = false,
    } = options;

    console.log(`📖 Reading recipes from: ${inputFile}`);

    // Read and parse JSON file
    const fileContent = fs.readFileSync(inputFile, "utf8");
    const recipes = JSON.parse(fileContent);

    if (!Array.isArray(recipes)) {
      throw new Error("JSON file must contain an array of recipes");
    }

    console.log(
      `🔍 Processing ${recipes.length} recipes for global deduplication...`
    );

    // Analyze duplicates before removal
    if (showAnalysis || previewOnly) {
      console.log("\n📊 GLOBAL DUPLICATE ANALYSIS:");
      console.log("==============================");

      const analysis = analyzeGlobalDuplicates(recipes);

      console.log(
        `Total unique ingredients: ${analysis.totalUniqueIngredients}`
      );
      console.log(
        `Ingredients with duplicates: ${analysis.ingredientsWithDuplicates}`
      );
      console.log(
        `Total duplicate occurrences to remove: ${analysis.totalDuplicatesFound}`
      );

      if (analysis.duplicateIngredients.size > 0) {
        console.log("\nMost duplicated ingredients:");

        // Sort by number of duplicates (descending)
        const sortedDuplicates = Array.from(
          analysis.duplicateIngredients.entries()
        ).sort(([, a], [, b]) => b.duplicateCount - a.duplicateCount);

        sortedDuplicates.slice(0, 15).forEach(([ingredient, data]) => {
          console.log(
            `  "${ingredient}": ${data.duplicateCount} duplicates (total occurrences: ${data.totalOccurrences})`
          );
          console.log(
            `    First occurrence: Recipe ${data.firstOccurrence.recipeId}`
          );
        });

        if (showRemovals) {
          console.log("\nDetailed removal preview:");
          sortedDuplicates.slice(0, 5).forEach(([ingredient, data]) => {
            console.log(`\n  "${ingredient}" will be removed from:`);
            data.allOccurrences.slice(1).forEach((occurrence) => {
              console.log(`    - Recipe ${occurrence.recipeId}`);
            });
          });
        }
      }
    }

    if (previewOnly) {
      console.log("\n👀 PREVIEW MODE - No files will be modified");
      return;
    }

    // Remove global duplicates
    console.log("🌍 Removing duplicate ingredients globally...");
    const { recipes: cleanedRecipes, stats } =
      removeAllDuplicateIngredients(recipes);

    // Generate output filename if not provided
    if (!outputFile) {
      const ext = path.extname(inputFile);
      const name = path.basename(inputFile, ext);
      const dir = path.dirname(inputFile);
      outputFile = path.join(dir, `${name}_global_deduplicated${ext}`);
    }

    // Write cleaned recipes to file
    fs.writeFileSync(outputFile, JSON.stringify(cleanedRecipes, null, 2));

    // Show results
    console.log("\n✅ GLOBAL DEDUPLICATION COMPLETE!");
    console.log("===================================");
    console.log(`📁 Output saved to: ${outputFile}`);
    console.log(`📊 Total recipes: ${stats.totalRecipes}`);
    console.log(`🔧 Recipes modified: ${stats.recipesModified}`);
    console.log(
      `🗑️  Total ingredients removed: ${stats.totalIngredientsRemoved}`
    );
    console.log(`✨ Unique ingredients kept: ${stats.uniqueIngredientsKept}`);
    console.log(
      `📉 Ingredients: ${stats.totalIngredientsBefore} → ${stats.totalIngredientsAfter}`
    );

    // Calculate reduction percentage
    const reduction = (
      (stats.totalIngredientsRemoved / stats.totalIngredientsBefore) *
      100
    ).toFixed(1);
    console.log(`📈 Reduction: ${reduction}% of all ingredients removed`);

    // Show most removed ingredients
    if (stats.removedIngredients.size > 0) {
      console.log("\nMost frequently removed ingredients:");
      const sortedRemovals = Array.from(
        stats.removedIngredients.entries()
      ).sort(([, a], [, b]) => b.length - a.length);

      sortedRemovals.slice(0, 10).forEach(([ingredient, removals]) => {
        console.log(
          `  "${ingredient}": removed from ${removals.length} recipes`
        );
      });
    }

    // File size comparison
    const originalSize = JSON.stringify(recipes).length;
    const newSize = JSON.stringify(cleanedRecipes).length;
    const sizeReduction = (
      ((originalSize - newSize) / originalSize) *
      100
    ).toFixed(1);

    if (newSize < originalSize) {
      console.log(`💾 File size reduced by ${sizeReduction}%`);
    }

    // Save removal report
    if (stats.removedIngredients.size > 0) {
      const reportFile = outputFile.replace(".json", "_removal_report.json");
      const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
          totalRecipes: stats.totalRecipes,
          recipesModified: stats.recipesModified,
          totalIngredientsRemoved: stats.totalIngredientsRemoved,
          uniqueIngredientsKept: stats.uniqueIngredientsKept,
        },
        removedIngredients: Object.fromEntries(stats.removedIngredients),
      };
      fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
      console.log(`📋 Removal report saved to: ${reportFile}`);
    }
  } catch (error) {
    console.error("❌ Error processing recipes:", error.message);
    process.exit(1);
  }
}

// Check if this file is being run directly (ES modules equivalent of require.main === module)
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
🌍 Global Ingredient Deduplicator

Removes ALL duplicate ingredients across the entire dataset.
Only keeps the FIRST occurrence of each ingredient.

Usage: node global-deduplicate.js <input.json> [output.json] [options]

Options:
  --preview         Show analysis without modifying files
  --show-analysis   Display detailed duplicate analysis  
  --show-removals   Show which recipes ingredients will be removed from
  
Examples:
  # Remove all global duplicates
  node global-deduplicate.js recipes.json

  # Preview changes with detailed analysis
  node global-deduplicate.js recipes.json --preview --show-analysis --show-removals
  
  # Specify output file
  node global-deduplicate.js recipes.json clean_recipes.json

How it works:
  1. Goes through recipes in order
  2. First time it sees "salt" in Recipe A → keeps it
  3. Every other time it sees "salt" in Recipe B, C, D... → removes it
  4. Result: "salt" only appears once in the entire dataset

⚠️  WARNING: This will significantly modify your recipes!
    Common ingredients like "salt", "pepper" will only appear in one recipe.
        `);
    process.exit(1);
  }

  const inputFile = args[0];
  let outputFile = args[1];

  // If second argument starts with --, it's an option, not output file
  if (outputFile && outputFile.startsWith("--")) {
    outputFile = null;
  }

  const options = {
    previewOnly: false,
    showAnalysis: false,
    showRemovals: false,
  };

  // Parse command line arguments
  for (const arg of args) {
    if (arg === "--preview") {
      options.previewOnly = true;
    } else if (arg === "--show-analysis") {
      options.showAnalysis = true;
    } else if (arg === "--show-removals") {
      options.showRemovals = true;
    }
  }

  deduplicateGlobalIngredients(inputFile, outputFile, options);
}

// Export functions
export {
  removeAllDuplicateIngredients,
  analyzeGlobalDuplicates,
  deduplicateGlobalIngredients,
};
