const mongoose = require('mongoose');

exports.pagination = async (
  model, 
  req, 
  baseQuery = {}, 
  filterQuery = {}, 
  populateOptions = null, 
  sortOptions = { createdAt: -1 },
  selectFields = null
) => {
  try {
    // Validate and sanitize pagination parameters
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    // Handle sorting from query parameters
    let finalSort = sortOptions;
    if (req.query.sort) {
      finalSort = parseSortQuery(req.query.sort);
    }

    // Combine all query conditions safely
    const finalQuery = combineQueries(baseQuery, filterQuery);

    // Validate the final query
    if (!isValidMongoQuery(finalQuery)) {
      throw new Error('Invalid query conditions');
    }

    // Get total count for pagination metadata
    const total = await model.countDocuments(finalQuery);
    
    // Build the main query
    let query = model.find(finalQuery);
    
    // Apply sorting
    if (finalSort && Object.keys(finalSort).length > 0) {
      query = query.sort(finalSort);
    }
    
    // Apply pagination
    query = query.skip(skip).limit(limit);
    
    // Apply field selection
    if (selectFields) {
      query = query.select(selectFields);
    }
    
    // Apply population
    if (populateOptions) {
      if (Array.isArray(populateOptions)) {
        populateOptions.forEach(popOption => {
          query = query.populate(popOption);
        });
      } else {
        query = query.populate(populateOptions);
      }
    }
    
    // Execute query
    const data = await query.lean();
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    
    return {
      success: true,
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
        count: data.length,
        skip,
      }
    };
    
  } catch (error) {
    console.error('Pagination error:', error);
    
    // Return error response with fallback data
    return {
      success: false,
      error: error.message,
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
      data: [],
      meta: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        count: 0,
        skip: 0,
      }
    };
  }
};

/**
 * Simplified pagination for cases where you only need basic functionality
 * @param {mongoose.Model} model - Mongoose model to query
 * @param {Object} req - Express request object  
 * @param {Object} query - Combined query conditions
 * @param {Array|Object|String} populateOptions - Populate options (optional)
 * @returns {Object} Basic pagination result
 */
exports.simplePagination = async (model, req, query = {}, populateOptions = null) => {
  return exports.pagination(model, req, query, {}, populateOptions);
};

/**
 * Advanced pagination with aggregation support
 * @param {mongoose.Model} model - Mongoose model
 * @param {Object} req - Express request object
 * @param {Array} pipeline - Aggregation pipeline
 * @returns {Object} Aggregated pagination result
 */
exports.aggregationPagination = async (model, req, pipeline = []) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const skip = (page - 1) * limit;

    // Create count pipeline
    const countPipeline = [
      ...pipeline,
      { $count: "total" }
    ];

    // Create data pipeline
    const dataPipeline = [
      ...pipeline,
      { $skip: skip },
      { $limit: limit }
    ];

    // Execute both pipelines
    const [countResult, data] = await Promise.all([
      model.aggregate(countPipeline),
      model.aggregate(dataPipeline)
    ]);

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        count: data.length,
        skip,
      }
    };

  } catch (error) {
    console.error('Aggregation pagination error:', error);
    return {
      success: false,
      error: error.message,
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
      data: [],
    };
  }
};

// Helper Functions

/**
 * Safely combine multiple query objects
 * @param {...Object} queries - Query objects to combine
 * @returns {Object} Combined query
 */
function combineQueries(...queries) {
  const validQueries = queries.filter(q => q && typeof q === 'object' && Object.keys(q).length > 0);
  
  if (validQueries.length === 0) {
    return {};
  }
  
  if (validQueries.length === 1) {
    return validQueries[0];
  }
  
  // Use $and to combine multiple conditions safely
  return { $and: validQueries };
}

/**
 * Parse sort query string into MongoDB sort object
 * Format: "field1:asc,field2:desc" or "field1,-field2"
 * @param {String} sortQuery - Sort query string
 * @returns {Object} MongoDB sort object
 */
function parseSortQuery(sortQuery) {
  if (!sortQuery || typeof sortQuery !== 'string') {
    return { createdAt: -1 };
  }
  
  const sortObj = {};
  const sortFields = sortQuery.split(',');
  
  for (const field of sortFields) {
    const trimmedField = field.trim();
    
    if (trimmedField.includes(':')) {
      // Format: "field:asc" or "field:desc"
      const [fieldName, direction] = trimmedField.split(':');
      if (fieldName && direction) {
        sortObj[fieldName.trim()] = direction.toLowerCase() === 'desc' ? -1 : 1;
      }
    } else if (trimmedField.startsWith('-')) {
      // Format: "-field" (descending)
      const fieldName = trimmedField.substring(1);
      if (fieldName) {
        sortObj[fieldName] = -1;
      }
    } else if (trimmedField) {
      // Format: "field" (ascending)
      sortObj[trimmedField] = 1;
    }
  }
  
  // Default sort if no valid fields found
  return Object.keys(sortObj).length > 0 ? sortObj : { createdAt: -1 };
}

/**
 * Validate if a query object is safe for MongoDB
 * @param {Object} query - Query object to validate
 * @returns {Boolean} Is valid query
 */
function isValidMongoQuery(query) {
  if (!query || typeof query !== 'object') {
    return false;
  }
  
  try {
    // Basic validation - check for potentially dangerous operators
    const queryStr = JSON.stringify(query);
    
    // Allow common MongoDB operators
    const allowedOperators = [
      '$and', '$or', '$not', '$nor',
      '$eq', '$ne', '$gt', '$gte', '$lt', '$lte',
      '$in', '$nin', '$exists', '$type', '$regex',
      '$all', '$elemMatch', '$size'
    ];
    
    // Check for dangerous operators (basic protection)
    const dangerousOperators = ['$where', '$javascript', '$js'];
    
    for (const dangerous of dangerousOperators) {
      if (queryStr.includes(dangerous)) {
        console.warn(`Dangerous operator detected: ${dangerous}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Query validation error:', error);
    return false;
  }
}

/**
 * Get pagination info without executing query (useful for headers/metadata)
 * @param {mongoose.Model} model - Mongoose model
 * @param {Object} req - Express request object
 * @param {Object} query - Query conditions
 * @returns {Object} Pagination metadata
 */
exports.getPaginationInfo = async (model, req, query = {}) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    
    const total = await model.countDocuments(query);
    const totalPages = Math.ceil(total / limit);
    
    return {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      skip: (page - 1) * limit,
    };
  } catch (error) {
    console.error('Pagination info error:', error);
    return {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
      skip: 0,
    };
  }
};