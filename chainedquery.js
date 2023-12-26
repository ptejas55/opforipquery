// Step 1: Set Up the Vehicle GraphQL Server
// Create a file named vehicleServer.js:

const { ApolloServer, gql } = require('apollo-server');

const typeDefs = gql`
  type Vehicle {
    id: ID!
    model: String!
    year: Int!
    manufacturerId: ID!
  }

  type Query {
    getVehicleById(vehicleId: ID!): Vehicle
  }
`;

const vehicles = [
  { id: '1', model: 'Car A', year: 2022, manufacturerId: '101' },
  { id: '2', model: 'Car B', year: 2021, manufacturerId: '102' },
];

const resolvers = {
  Query: {
    getVehicleById: (parent, { vehicleId }, context, info) => {
      return vehicles.find(vehicle => vehicle.id === vehicleId);
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Vehicle server ready at ${url}`);
});


// Step 2: Set Up the Manufacturer GraphQL Server
// Create a file named manufacturerServer.js:

const { ApolloServer, gql } = require('apollo-server');

const typeDefs = gql`
  type Manufacturer {
    id: ID!
    name: String!
    country: String!
  }

  type Query {
    getManufacturerById(manufacturerId: ID!): Manufacturer
  }
`;

const manufacturers = [
  { id: '101', name: 'Manufacturer A', country: 'Country A' },
  { id: '102', name: 'Manufacturer B', country: 'Country B' },
];

const resolvers = {
  Query: {
    getManufacturerById: (parent, { manufacturerId }, context, info) => {
      return manufacturers.find(manufacturer => manufacturer.id === manufacturerId);
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Manufacturer server ready at ${url}`);
});

// Step 3: Set Up the Main GraphQL Server
// Create a file named mainServer.js:

const { ApolloServer, gql } = require('apollo-server');
const axios = require('axios');

const typeDefs = gql`
  type Vehicle {
    id: ID!
    model: String!
    year: Int!
    manufacturer: Manufacturer
  }

  type Manufacturer {
    id: ID!
    name: String!
    country: String!
  }

  type Query {
    getVehicleWithManufacturer(vehicleId: ID!): Vehicle
  }
`;

const resolvers = {
  Query: {
    getVehicleWithManufacturer: async (parent, { vehicleId }, context, info) => {
      const vehicleApiUrl = 'http://localhost:4001'; // URL of the vehicle server
      const manufacturerApiUrl = 'http://localhost:4002'; // URL of the manufacturer server

      try {
        // Make a GraphQL query to the vehicle API
        const vehicleResponse = await axios.post(`${vehicleApiUrl}/graphql`, {
          query: `
            query {
              getVehicleById(vehicleId: "${vehicleId}") {
                id
                model
                year
                manufacturerId
              }
            }
          `,
        });

        // Get the vehicle data from the response
        const vehicleData = vehicleResponse.data.data.getVehicleById;

        // Make a GraphQL query to the manufacturer API using the manufacturerId from the vehicle data
        const manufacturerResponse = await axios.post(`${manufacturerApiUrl}/graphql`, {
          query: `
            query {
              getManufacturerById(manufacturerId: "${vehicleData.manufacturerId}") {
                id
                name
                country
              }
            }
          `,
        });

        // Attach the manufacturer data to the vehicle data
        vehicleData.manufacturer = manufacturerResponse.data.data.getManufacturerById;

        return vehicleData;
      } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error('Failed to fetch data');
      }
    },
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Main server ready at ${url}`);
});

     
// Explanation:

// We define a GraphQL schema with a Vehicle type, a Manufacturer type, and a Query type.
// The getVehicleWithManufacturer query fetches a vehicle by its ID and includes the associated manufacturer details.
// The resolver for getVehicleWithManufacturer makes GraphQL queries to both the vehicle and manufacturer servers using Axios.
// The vehicle and manufacturer data are combined and returned as a single response.
// To run the servers, execute the following commands in separate terminal windows:

// bash
// Copy code
// node vehicleServer.js
// bash
// Copy code
// node manufacturerServer.js
// bash
// Copy code
// node mainServer.js
// Now, you can make a query to the main server:

// graphql
// Copy code
// query {
//   getVehicleWithManufacturer(vehicleId: "1") {
//     id
//     model
//     year
//     manufacturer {
//       id
//       name
//       country
//     }
//   }
// }
// This should return the details of a vehicle along with its associated manufacturer.
