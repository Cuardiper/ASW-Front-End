import React, {Component} from "react";
import {Link} from "react-router-dom";
import {issueService} from '../../_services/issue.service'

import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TablePagination from '@material-ui/core/TablePagination';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Checkbox from "@material-ui/core/Checkbox";
import Tooltip from "@material-ui/core/Tooltip";
import PropTypes, {any} from 'prop-types';
import {lighten} from "@material-ui/core/styles/colorManipulator";
import Typography from "@material-ui/core/Typography";
import Toolbar from "@material-ui/core/Toolbar";

import IconButton from "@material-ui/core/IconButton";
import DeleteIcon from '@material-ui/icons/Delete';
import FilterListIcon from '@material-ui/icons/FilterList';

import Button from '@material-ui/core/Button/index';

import classNames from 'classnames';
import withStyles from "@material-ui/core/es/styles/withStyles";
import Paper from "@material-ui/core/Paper";
import {userService} from "../../_services/user.service";
import './table.css';

const img = {
    marginLeft: '15px',
    borderRadius: '50%',
    marginRight: '15px',
};

const button = {
    marginLeft: '15px',
}

let counter = 0;

function createData(title, type, status, priority, issueID, votes, assignee_id, created, updated) {
    counter += 1;
    created = created.substring(0, 10);
    updated = updated.substring(0, 10);
    return { id: issueID, title, type, status, priority, issueID, votes, assignee_id, created, updated};
}

function desc(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) {
        return -1;
    }
    if (b[orderBy] > a[orderBy]) {
        return 1;
    }
    return 0;
}

function stableSort(array, cmp) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = cmp(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map(el => el[0]);
}

function getSorting(order, orderBy) {
    return order === 'desc' ? (a, b) => desc(a, b, orderBy) : (a, b) => -desc(a, b, orderBy);
}

const rows = [
    //{ id: 'id', numeric: true, disablePadding: true, label: 'ID' },
    { id: 'title', numeric: false, disablePadding: true, label: 'Title' },
    { id: 'type', numeric: false, disablePadding: false, label: 'Type' },
    { id: 'priority', numeric: false, disablePadding: false, label: 'Priority' },
    { id: 'status', numeric: false, disablePadding: false, label: 'Status'},
    { id: 'votes', numeric: false, disablePadding: false, label: 'Votes' },
    { id: 'assignee', numeric: false, disablePadding: false, label: 'Assignee'},
    { id: 'createdAt', numeric: false, disablePadding: false, label: 'Created'},
    { id: 'updatedAt', numeric: false, disablePadding: false, label: 'Updated'},
    { id: 'spaceForEditImage', numeric: false, disablePadding: false, label: ''}, //espacio para que la linea de la cabecera cubra todo
];




class EnhancedTableHead extends Component {

    createSortHandler = property => event => {
        this.props.onRequestSort(event, property);
    };


    render() {
        const { order, orderBy, rowCount } = this.props;
        return(

            <TableHead>

                <TableRow>
                    {rows.map(
                    row => (
                        <TableCell
                            padding="checkbox"
                            key={row.id}
                            align={row.numeric ? 'right' : 'left'}
                            sortDirection={orderBy === row.id ? order : false}
                        >
                            <Tooltip
                                title="Sort"
                                placement={row.numeric ? 'bottom-end' : 'bottom-start'}
                                enterDelay={300}
                            >
                                <TableSortLabel
                                    active={orderBy === row.id}
                                    direction={order}
                                    onClick={this.createSortHandler(row.id)}
                                >
                                    {row.label}
                                </TableSortLabel>
                            </Tooltip>
                        </TableCell>
                    ),
                    this,
                )}
                </TableRow>
            </TableHead>
        );
    }
}

EnhancedTableHead.propTypes = {
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    order: PropTypes.string.isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired,
};

const toolbarStyles = theme => ({
    root: {
        paddingRight: theme.spacing.unit,
    },
    highlight:
        theme.palette.type === 'light'
            ? {
                color: theme.palette.secondary.main,
                backgroundColor: lighten(theme.palette.secondary.light, 0.85),
            }
            : {
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.secondary.dark,
            },
    spacer: {
        flex: '1 1 100%',
    },
    actions: {
        color: theme.palette.text.secondary,
    },
    title: {
        flex: '0 0 auto',
    },
});

let EnhancedTableToolbar = props => {
    const {classes} = props;

    return (
        <Toolbar
            className={classNames(classes.root, )}
        >
            <div className={classes.title}>
                <Typography variant="h6" id="tableTitle">
                    Issues
                </Typography>
            </div>
            <div className={classes.spacer} />
            <div className={classes.actions}>
                <Tooltip title="Filter list">
                    <IconButton aria-label="Filter list">
                        <FilterListIcon />
                    </IconButton>
                </Tooltip>
            </div>
        </Toolbar>
    );
};

EnhancedTableToolbar.propTypes = {
    classes: PropTypes.object.isRequired,
};

EnhancedTableToolbar = withStyles(toolbarStyles)(EnhancedTableToolbar);

const styles = theme => ({
    root: {
        width: '100%',
        marginTop: theme.spacing.unit * 3,
    },
    table: {
        minWidth: 1020,
    },
    tableWrapper: {
        overflowX: 'auto',
    },
});


class EnhancedTable extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            order: 'asc',
            orderBy: 'calories',
            data: [],
            page: 0,
            rowsPerPage: 5,

            assignee_avatar: "",
            assignee_name: ""
        }
    };

    componentDidMount() {
        this.getPalabras('all');
    };

    getPalabras(filtro){
        let issues;
        if(filtro == 'all'){
            issues = issueService.getAll();
        }
        else if(filtro == 'unresolved') {
            issues = issueService.getUnresolved();
        }
        else if(filtro == 'myIssues') {
            issues = issueService.getMyIssues();
        }
        else if(filtro == 'watching') {
            issues = issueService.getWatching();
            /*
            console.log(issues);
            issues.then(function(result) {
                console.log(result) // "Some User token"
            })
            */
        }
        issues.then( datos => {
            console.log(datos);
            console.log(datos.length);
            let data = [];
            datos.forEach( issue => {
                let votes = 0;
                if (issue.votes != null) {
                    votes=issue.votes;
                }

                /*
                let assignee_avatar = "";
                let assignee_name = "";
                console.log(issue.assignee_id);
                if (issue.assignee_id != null){
                    userService.getByID(issue.assignee_id)
                        .then ( res => {
                            //this.setState({assignee_name: res.name, assignee_avatar: res.foto});
                            assignee_name = res.name;
                            assignee_avatar = res.foto;
                            //console.log(assignee_name);
                            //console.log(assignee_avatar);
                            //data.push(createData(issue.title, issue.type_issue, issue.status, issue.priority, issue.id, votes, assignee_name,issue.created_at,issue.updated_at, assignee_avatar));
                        })
                        .catch(error => {
                            console.log(error);
                        });
                }
                */
                //console.log(this.state.assignee_name);
                //console.log(this.state.assignee_avatar);
                data.push(createData(issue.title, issue.type_issue, issue.status, issue.priority, issue.id, votes, issue.assignee_id,issue.created_at,issue.updated_at));
            });
            console.log(data);
            console.log(data.length);
            this.setState({data});
        });
    };

    handleRequestSort = (event, property) => {
        const orderBy = property;
        let order = 'desc';

        if (this.state.orderBy === property && this.state.order === 'desc') {
            order = 'asc';
        }

        this.setState({ order, orderBy });
    };

    handleClick = (event, id) => {
        //ToDo handle select
    };

    handleChangePage = (event, page) => {
        this.setState({ page });
    };

    handleChangeRowsPerPage = event => {
        this.setState({ rowsPerPage: event.target.value });
    };

    getUserInfo(id) {
        userService.getByID(id)
            .then ( data => {
                this.setState({assignee_name: data.name, assignee_avatar: data.foto});
            })
            .catch(error => {
                console.log(error);
            });
    }

    render() {
        const {classes} = this.props;
        const {data, order, orderBy, rowsPerPage, page} = this.state;
        const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);

        return (
            <div>
                <Paper className={classes.root}>
                    <Button variant="contained" color="primary" onClick={ () => this.getPalabras('all')}> All </Button>
                    <Button style = {button} variant="contained" color="primary" onClick={ () => this.getPalabras('unresolved')}> Unresolved </Button>
                    <Button style = {button}  variant="contained" color="primary" onClick={ () => this.getPalabras('myIssues')}> My Issues </Button>
                    <Button style = {button}  variant="contained" color="primary" onClick={ () => this.getPalabras('watching')}> Watching </Button>
                    <EnhancedTableToolbar />
                    <div className={classes.tableWrapper}>
                        <Table className={classes.table} aria-labelledby="tableTitle">
                            <EnhancedTableHead
                                order={order}
                                orderBy={orderBy}
                                onRequestSort={this.handleRequestSort}
                                rowCount={data.length}
                            />
                            <TableBody>
                                {stableSort(data, getSorting(order, orderBy))
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map(n => {
                                        /*
                                        if (n.assignee_id != null) {
                                            this.getUserInfo(n.assignee_id);
                                        }
                                        */
                                        return (
                                            <TableRow
                                                hover
                                                onClick={event => this.handleClick(event, n.id)}
                                                role="checkbox"
                                                tabIndex={-1}
                                                key={n.id}
                                            >
                                                <TableCell padding="checkbox" component="th" scope="row">
                                                    <Link to={'/issues/' + n.issueID}>{'#' + n.issueID + ' ' + n.title}</Link>
                                                </TableCell>
                                                <TableCell><img src={process.env.PUBLIC_URL + '/iconos/' + n.type + '.svg'} alt={n.type}/></TableCell>
                                                <TableCell><img src={process.env.PUBLIC_URL + '/iconos/' + n.priority + '.svg'} alt={n.priority}/></TableCell>
                                                <TableCell>{n.status}</TableCell>
                                                <TableCell>{n.votes}</TableCell>
                                                <TableCell><img className='avatar' style={img}  src={this.state.assignee_avatar} />{this.state.assignee_name}</TableCell>
                                                <TableCell>{n.created}</TableCell>
                                                <TableCell>{n.updated}</TableCell>
                                                <TableCell><img src={process.env.PUBLIC_URL + '/iconos/not-watching.svg'} alt={'NOT-Watch'}/></TableCell>
                                            </TableRow>
                                        );
                                    })}
                                {emptyRows > 0 && (
                                    <TableRow style={{ height: 49 * emptyRows }}>
                                        <TableCell colSpan={6} />
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <TablePagination
                        rowsPerPageOptions={[5, 10, 25]}
                        component="div"
                        count={data.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        backIconButtonProps={{
                            'aria-label': 'Previous Page',
                        }}
                        nextIconButtonProps={{
                            'aria-label': 'Next Page',
                        }}
                        onChangePage={this.handleChangePage}
                        onChangeRowsPerPage={this.handleChangeRowsPerPage}
                    />
                </Paper>
            </div>
    );
    }
}

EnhancedTable.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(EnhancedTable);