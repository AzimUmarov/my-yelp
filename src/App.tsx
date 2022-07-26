import Amplify, { API, graphqlOperation } from 'aws-amplify';
import { Authenticator } from '@aws-amplify/ui-react';
import React, { useEffect, useReducer } from 'react';
import {  Nav, Navbar, Button, Col, Container, Form, Row, Table } from 'react-bootstrap';

import './App.css';
import awsConfig from './aws-exports';
import { createRestaurant } from './graphql/mutations';
import { listRestaurants } from './graphql/queries';
import { onCreateRestaurant } from './graphql/subscriptions';

import "@aws-amplify/ui-react/styles.css";

Amplify.configure(awsConfig);

type Restaurant = {
  name: string;
  description: string;
  city: string;
};

type AppState = {
  restaurants: Restaurant[];
  formData: Restaurant;
};

type Action =
    | {
  type: 'QUERY';
  payload: Restaurant[];
}
    | {
  type: 'SUBSCRIPTION';
  payload: Restaurant;
}
    | {
  type: 'SET_FORM_DATA';
  payload: { [field: string]: string };
};

type SubscriptionEvent<D> = {
  value: {
    data: D;
  };
};

const initialState: AppState = {
  restaurants: [],
  formData: {
    name: '',
    city: '',
    description: '',
  },
};
const reducer = (state: AppState, action: Action) => {
  switch (action.type) {
    case 'QUERY':
      return { ...state, restaurants: action.payload };
    case 'SUBSCRIPTION':
      return { ...state, restaurants: [...state.restaurants, action.payload] };
    case 'SET_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    default:
      return state;
  }
};

const App: React.FC = () => {
  const createNewRestaurant = async (e: React.SyntheticEvent) => {
    e.stopPropagation();
    const { name, description, city } = state.formData;
    const restaurant = {
      name,
      description,
      city,
    };
    await API.graphql(graphqlOperation(createRestaurant, { input: restaurant }));
  };

  const [state, dispatch] = useReducer(reducer, initialState);
  type Unsubscribe = {
    unsubscribe : () => void
  }

  type Subscriber = {
    subscribe: (observer : object ) => Unsubscribe
  }

  useEffect(() => {
    getRestaurantList();
    const subscription  = (API.graphql(graphqlOperation(onCreateRestaurant)) as Subscriber).subscribe({
      next: (eventData: SubscriptionEvent<{ onCreateRestaurant: Restaurant }>) => {
        const payload = eventData.value.data.onCreateRestaurant;
        dispatch({ type: 'SUBSCRIPTION', payload });
      },
    });

    return () => subscription.unsubscribe();
  }, []);

  const getRestaurantList = async () => {
    const restaurants : any = await API.graphql(graphqlOperation(listRestaurants));
    dispatch({
      type: 'QUERY',
      payload: restaurants.data.listRestaurants.items,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
      dispatch({
        type: 'SET_FORM_DATA',
        payload: { [e.target.name]: e.target.value },
      });

  return (
      <Authenticator className="d-flex justify-content-center vh-100 bg-primary align-items-center">
        {({signOut}) => (
            <div className="App">
              <Container>
              <Navbar className="shadow-sm mb-3">
                <Navbar.Brand className="font-weight-bold" >My yelp Qwasar.io</Navbar.Brand>
                <Navbar.Collapse>
                  <Nav className="justify-content-end" style={{ width: "100%" }}>
                    <Button className="btn btn-primary" onClick={signOut}> Sign out</Button>
                  </Nav>
                </Navbar.Collapse>
              </Navbar>
              </Container>
              <Container>
                <Row className="mt-3">
                  <Col md={4}>
                    <Form>
                      <Form.Group controlId="formDataName">
                        <Form.Control  className = "mb-3"  onChange={handleChange} type="text" name="name" placeholder="Name" />
                      </Form.Group>
                      <Form.Group controlId="formDataDescription">
                        <Form.Control className = "mb-3" onChange={handleChange} type="text" name="description" placeholder="Description" />
                      </Form.Group>
                      <Form.Group controlId="formDataCity">
                        <Form.Control className = "mb-3"  onChange={handleChange} type="text" name="city" placeholder="City" />
                      </Form.Group>
                      <Button onClick={createNewRestaurant} className="float-left mb-3">
                        Add New Restaurant
                      </Button>
                    </Form>
                  </Col>
                </Row>

                {state.restaurants.length ? (
                    <Row className="my-3">
                      <Col>
                        <Table striped bordered hover>
                          <thead>
                          <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Description</th>
                            <th>City</th>
                          </tr>
                          </thead>
                          <tbody>
                          {state.restaurants.map((restaurant, index) => (
                              <tr key={`restaurant-${index}`}>
                                <td>{index + 1}</td>
                                <td>{restaurant.name}</td>
                                <td>{restaurant.description}</td>
                                <td>{restaurant.city}</td>
                              </tr>
                          ))}
                          </tbody>
                        </Table>
                      </Col>
                    </Row>
                ) : null}
              </Container>
            </div>
        )}
      </Authenticator>
  );
};

export default App;
