const ingredientInput = document.getElementById("ingredientInput");
const ingredientsContainer = document.getElementById("ingredientsContainer");
const ingredients = [];

function updateIngredientsDisplay() {
  if (ingredients.length === 0) {
    ingredientsContainer.innerHTML =
      '<div class="placeholder-text">Your ingredients will appear here...</div>';
    return;
  }

  ingredientsContainer.innerHTML = "";
  ingredients.forEach((ingredient, index) => {
    const ingredientTag = document.createElement("div");
    ingredientTag.className = "ingredient-tag";
    ingredientTag.innerHTML = `
            <span>${ingredient}</span>
            <button class="remove-ingredient" onclick="removeIngredient(${index})" aria-label="Remove ${ingredient}">×</button>
        `;
    ingredientsContainer.appendChild(ingredientTag);
  });
}

function addIngredient() {
  const ingredient = ingredientInput.value.trim();
  if (ingredient && !ingredients.includes(ingredient.toLowerCase())) {
    ingredients.push(ingredient);
    updateIngredientsDisplay();
    ingredientInput.value = "";
  }
}

function removeIngredient(index) {
  ingredients.splice(index, 1);
  updateIngredientsDisplay();
}

ingredientInput.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    addIngredient();
  }
});

// Focus on input when page loads
window.addEventListener("load", function () {
  ingredientInput.focus();
});
