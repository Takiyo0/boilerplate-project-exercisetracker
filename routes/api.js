const route = require("express").Router();
const quickDb = require("quick.db");

const user = {
    create: (username) => {
        const user = buildUser(username);
        quickDb.push("data.users", user);
        return user;
    },
    getById: (id) => {
        const user = quickDb.get("data.users");
        return Array.isArray(user) ? user.find(x => x._id === id) : null;
    },
    removeById: (id) => {
        const user = quickDb.get("data.users");
        const target = user.find(x => x._id === id);
        if (!target) return false;
        quickDb.set("data.users", [...user.filter(x => x._id !== id)]);
        return target;
    },
    setById: (id, data = {}) => {
        if (!user.getById(id)) return false;
        let _user = user.getById(id);
        user.removeById(id);
        _user = {..._user, ...data};
        quickDb.push("data.users", _user);
        return _user;
    }
}

const data = {
    getUserOnlyById: (id) => {
        const user = quickDb.get("data.users") ? quickDb.get("data.users").find(x => x._id === id) : null;
        if (!user) return false;
        return {
            username: user.username,
            _id: user._id
        }
    },
    getLogsOnlyById: (id) => {
        const user = quickDb.get("data.users") ? quickDb.get("data.users").find(x => x._id === id) : null;
        if (!user) return false;
        return {
            username: user.username,
            count: Number(user.count),
            log: user.log,
            _id: user._id
        }
    }
}

const builder = {
    exercise: (desc, duration, date) => {
        return {
            description: desc,
            duration: isNaN(duration) ? 0 : Number(duration),
            date: new Date(date).toString() === "Invalid Date" ? `${new Date().toString().split("").filter((_, x) => x < 15).join("")}` : `${new Date(date).toString().split("").filter((_, x) => x < 15).join("")}`
        }
    }
}

const log = {
    push: (id, exercise) => {
        const _user = quickDb.get("data.users") ? quickDb.get("data.users").find(x => x._id === id) : null;
        if (!_user) return false;
        user.setById(id, {
            log: (() => {
                _user.log.push(exercise);
                return _user.log;
            })(),
            count: _user.log.length
        })
        return quickDb.get("data.users").find(x => x._id === id);
    }
}

const exercise = {
    add: (userId, desc, duration, date) => {
        const _user = user.getById(userId);
        if (!_user) return false;
        let _exercise = builder.exercise(desc, duration, date);
        const test = log.push(userId, _exercise);
        return {...data.getUserOnlyById(userId), ..._exercise};
    }
}

module.exports = () => {
    route.get("/", (req, res) => {
        res.json({owo: 1});
    });

    // ------------------------------------------------- { users } --------------------------------------------------------//
    route.get("/users", (req, res) => {
        return res.json(quickDb.get("data.users"));
    });

    route.post("/users", (req, res) => {
        const body = req.body;
        if (!body.username || !buildUser(body.username).username) return res.json({error: "Invalid username"});

        const _user = user.create(body.username);
        return res.json(data.getUserOnlyById(_user._id));
    })

    // -------------------------------------------- { user exercises } -----------------------------------------------------//
    route.post("/users/:id/exercises", (req, res) => {
        let params = req.params, body = req.body;
        if (!params.id) return res.json({error: "No id was given"});

        let _user = user.getById(params.id);
        if (!_user) return res.json({error: "No user was found"});

        return res.json(exercise.add(params.id, body.description || "No description", body.duration, body.date));
    })

    // -------------------------------------------- { user exercises } -----------------------------------------------------//
    route.get("/users/:id/logs", (req, res) => {
        let params = req.params, body = req.body, query = req.query;
        if (!params.id) return res.json({error: "No id was given"});

        let _user = user.getById(params.id);
        if (!_user) return res.json({error: "No user was found"});

        let logData = data.getLogsOnlyById(params.id);
        if(logData.log.length) logData.log = sortLogs(logData.log, query.from, query.to, query.limit);
        return res.json(logData);
    })
    return route;
}

function sortLogs(logs, from, to, limit) {
  let result = logs;
  console.log(result, from, to);
  if(from && isValidDate(from)) result = result.filter(l => new Date(l.date) > new Date(from));
  if(to && isValidDate(to)) result = result.filter(l => new Date(l.date) < new Date(to));
  if(!isNaN(limit)) result.length = Number(limit);

  return result;
}

function isValidDate(date) {
  return new Date(date).toString() !== "Invalid Date";
}

function buildUser(username) {
    if (!username || typeof username !== "string") return {username: null, id: null};
    return {
        username,
        _id: getRandomId(),
        // description: "",
        // duration: NaN,
        // date: "",
        count: 0,
        log: []
    }
}

function getRandomId() {
    let letters = "abcdefghijklmnopqrstuvwxyzABCEFGHIJKLMNOPQRSTUVWXYZ1234567890123456789000";
    letters = letters.split("");

    let id = "", count = 0;

    while (count < 25) {
        count += 1;
        id += letters[Math.floor(Math.random() * letters.length)];
    }
    return id;
}