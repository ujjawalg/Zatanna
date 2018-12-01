import React from 'react';
import { Menu, Icon } from 'semantic-ui-react';
import { Link } from 'react-router-dom';

export default () => {
  return (
    <Menu style={{ marginTop: '0px', }} size={'large'}>
      <Menu.Item><Link to='/'>Zatanna</Link></Menu.Item>
      <Menu.Menu position="right">
        <Menu.Item><Link to='/someLink'><Icon name='tasks' />Some Link</Link></Menu.Item>
      </Menu.Menu>
    </Menu>
  );
};