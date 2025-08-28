#!/bin/bash

# Branch names
SOURCE_BRANCH="Development"
TARGET_BRANCH="main"

# Checkout main branch
echo "Checking out $TARGET_BRANCH..."
git checkout $TARGET_BRANCH

# Pull latest changes
echo "Pulling latest changes from origin/$TARGET_BRANCH..."
git pull origin $TARGET_BRANCH

# Merge Development into main
echo "Merging $SOURCE_BRANCH into $TARGET_BRANCH..."
git merge $SOURCE_BRANCH

# Push to origin main
echo "Pushing $TARGET_BRANCH to origin..."
git push origin $TARGET_BRANCH

# Push to personal remote (zack)
echo "Pushing $TARGET_BRANCH to zack..."
git push zack $TARGET_BRANCH

echo "Merge complete!"