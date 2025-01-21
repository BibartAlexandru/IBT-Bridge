import React from "react";
import { Navbar, Container, Nav, NavDropdown } from "react-bootstrap";
import "./IBTNavbar.css";
import "bootstrap/dist/css/bootstrap.min.css";
const IBTNavbar = () => {
  return (
    <Navbar expand="lg">
      <Container>
        <Navbar.Brand href="/">IBT 🌉</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Toggle aria-controls="sui-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <NavDropdown title="Ethereum" id="basic-nav-dropdown">
              <NavDropdown.Item href="/ethereum/deployer">
                Deployer
              </NavDropdown.Item>
              <NavDropdown.Item href="/ethereum/user">User</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
        <Navbar.Collapse id="sui-navbar-nav">
          <Nav className="me-auto">
            <NavDropdown title="SUI" id="sui-navbar-dropdown">
              <NavDropdown.Item href="/sui/deployer">Deployer</NavDropdown.Item>
              <NavDropdown.Item href="/sui/user">User</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default IBTNavbar;
